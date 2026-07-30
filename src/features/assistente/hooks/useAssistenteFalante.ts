import * as Speech from 'expo-speech';
import {useCallback, useEffect, useRef} from 'react';

import {useAssistentePreferences} from '../../../core/preferences/AssistentePreferencesContext';

interface UseAssistenteFalanteReturn {
  falar: (texto: string) => Promise<void>;
  parar: () => Promise<void>;
}

/**
 * Prioriza português do Brasil e vozes aprimoradas instaladas no aparelho.
 */
const pontuarVoz = (voz: Speech.Voice): number => {
  const idioma = voz.language.replace('_', '-').toLowerCase();
  const descricao = `${voz.name} ${voz.identifier}`.toLowerCase();
  let pontuacao = idioma === 'pt-br' ? 100 : idioma.startsWith('pt') ? 50 : 0;

  if (voz.quality === Speech.VoiceQuality.Enhanced) pontuacao += 40;
  if (/\b(premium|natural|enhanced|aprimorada)\b/.test(descricao)) {
    pontuacao += 20;
  }
  if (/\b(default|padrao|padrão|compact)\b/.test(descricao)) {
    pontuacao -= 10;
  }

  return pontuacao;
};

/**
 * Centraliza as respostas faladas do assistente e impede que frases antigas
 * permaneçam na fila quando o usuário envia um novo comando.
 */
export default function useAssistenteFalante(): UseAssistenteFalanteReturn {
  const {
    respostasFaladasAtivas,
    preferenciasCarregadas,
  } = useAssistentePreferences();
  const vozPreferidaRef = useRef<string | null>(null);
  const carregamentoVozRef = useRef<Promise<string | null> | null>(null);
  const versaoFalaRef = useRef(0);

  /**
   * Resolve a melhor voz uma única vez e mantém o fallback padrão se o aparelho
   * não disponibilizar uma alternativa em português.
   */
  const obterVozPreferida = useCallback(async (): Promise<string | null> => {
    if (vozPreferidaRef.current) return vozPreferidaRef.current;
    if (carregamentoVozRef.current) return carregamentoVozRef.current;

    carregamentoVozRef.current = Speech.getAvailableVoicesAsync()
      .then(vozes => {
        const vozesEmPortugues = vozes
          .filter(
            voz =>
              voz.language.replace('_', '-').toLowerCase() === 'pt-br',
          )
          .sort((a, b) => pontuarVoz(b) - pontuarVoz(a));
        const vozSelecionada = vozesEmPortugues[0]?.identifier ?? null;

        vozPreferidaRef.current = vozSelecionada;
        return vozSelecionada;
      })
      .catch(() => null);

    return carregamentoVozRef.current;
  }, []);

  const parar = useCallback(async (): Promise<void> => {
    versaoFalaRef.current += 1;
    await Speech.stop();
  }, []);

  const falar = useCallback(async (texto: string): Promise<void> => {
    const versaoFala = ++versaoFalaRef.current;

    await Speech.stop();
    if (!preferenciasCarregadas || !respostasFaladasAtivas) return;

    const voz = await obterVozPreferida();

    if (
      versaoFala !== versaoFalaRef.current ||
      !respostasFaladasAtivas
    ) {
      return;
    }

    Speech.speak(texto, {
      language: 'pt-BR',
      rate: 0.9,
      pitch: 1,
      voice: voz ?? undefined,
    });
  }, [
    obterVozPreferida,
    preferenciasCarregadas,
    respostasFaladasAtivas,
  ]);

  useEffect(() => {
    if (preferenciasCarregadas && respostasFaladasAtivas) {
      void obterVozPreferida();
    }

    return () => {
      versaoFalaRef.current += 1;
      void Speech.stop();
    };
  }, [
    obterVozPreferida,
    preferenciasCarregadas,
    respostasFaladasAtivas,
  ]);

  return {
    falar,
    parar,
  };
}
