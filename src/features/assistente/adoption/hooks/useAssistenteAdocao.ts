import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {
  getCurrentRouteName,
  navigationRef,
} from '../../../../application/navigation/navigationService';
import useStrapiClient from '../../../../core/api/strapiClient';
import {useAuthContext} from '../../../../core/auth/AuthContext';
import {getAuthUserKey} from '../../../../core/auth/getAuthUserKey';
import {registrarMetricaAssistente} from '../../services/metricaAssistenteApi';
import type {
  EstadoAdocaoAssistente,
  SugestaoContextualAssistente,
} from '../models/AssistenteAdocao';
import {
  DICA_DESCOBERTA_ASSISTENTE,
  obterChaveDataLocal,
  obterSugestaoContextualAssistente,
  podeExibirDicaDescoberta,
} from '../useCases/obterSugestaoContextualAssistente';

const STORAGE_PREFIX = '@drogal:assistant-adoption:v1';
const MAXIMO_DICAS_CONTEXTO = 3;
const ATRASO_DESCOBERTA_MS = 4_000;
const DURACAO_DESCOBERTA_MS = 7_000;
const ATRASO_CONTEXTO_MS = 2_000;
const DURACAO_CONTEXTO_MS = 6_500;
const ESTADO_INICIAL: EstadoAdocaoAssistente = {
  assistenteDescoberta: false,
  apresentacaoVisualizada: false,
  datasDicaDescobertaExibida: [],
  totalDicasExibidas: 0,
  telasComDica: [],
};

interface UseAssistenteAdocaoParams {
  habilitada: boolean;
  assistenteVisivel: boolean;
  tecladoVisivel: boolean;
}

/**
 * Controla descoberta, onboarding e dicas sem participar da interpretação.
 * O estado é local, isolado por usuário e versão; só eventos técnicos chegam
 * ao servidor.
 */
export default function useAssistenteAdocao({
  habilitada,
  assistenteVisivel,
  tecladoVisivel,
}: UseAssistenteAdocaoParams) {
  const client = useStrapiClient();
  const {user} = useAuthContext();
  const userKey = getAuthUserKey(user);
  const version = Constants.expoConfig?.version ?? 'desconhecida';
  const storageKey = useMemo(
    () => userKey ? `${STORAGE_PREFIX}:${version}:${userKey}` : null,
    [userKey, version],
  );
  const [carregado, setCarregado] = useState(false);
  const [telaAtual, setTelaAtual] = useState(getCurrentRouteName());
  const [dica, setDica] = useState<SugestaoContextualAssistente | null>(null);
  const [apresentacaoVisivel, setApresentacaoVisivel] = useState(false);
  const estadoRef = useRef(ESTADO_INICIAL);

  const registrarEvento = useCallback((acao: string): void => {
    registrarMetricaAssistente(client, {
      tela: getCurrentRouteName() ?? 'Desconhecida',
      origemInterpretacao: 'ATALHO',
      resultado: 'SUCESSO',
      dominio: 'adocao',
      acao,
      tempoRespostaMs: 0,
      versaoApp: Constants.expoConfig?.version,
    });
  }, [client]);

  const persistir = useCallback(async (
    proximo: EstadoAdocaoAssistente,
  ): Promise<void> => {
    estadoRef.current = proximo;
    if (!storageKey) return;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(proximo));
    } catch {
      // O estado em memória continua válido se o armazenamento falhar.
    }
  }, [storageKey]);

  useEffect(() => {
    let ativo = true;
    setCarregado(false);
    setDica(null);
    setApresentacaoVisivel(false);

    if (!storageKey) {
      estadoRef.current = ESTADO_INICIAL;
      setCarregado(true);
      return () => { ativo = false; };
    }

    void AsyncStorage.getItem(storageKey).then(valor => {
      if (!ativo) return;
      let proximo = ESTADO_INICIAL;
      try {
        const salvo = valor
          ? JSON.parse(valor) as Partial<EstadoAdocaoAssistente>
          : null;
        if (salvo) {
          const apresentacaoVisualizada = salvo.apresentacaoVisualizada === true;
          proximo = {
            // A migração não reapresenta descoberta a quem já viu o onboarding.
            assistenteDescoberta:
              salvo.assistenteDescoberta === true || apresentacaoVisualizada,
            apresentacaoVisualizada,
            datasDicaDescobertaExibida:
              Array.isArray(salvo.datasDicaDescobertaExibida)
                ? salvo.datasDicaDescobertaExibida
                    .filter(item => typeof item === 'string')
                    .slice(0, 2)
                : [],
            totalDicasExibidas: Math.max(
              0,
              Math.min(
                MAXIMO_DICAS_CONTEXTO,
                Number(salvo.totalDicasExibidas) || 0,
              ),
            ),
            telasComDica: Array.isArray(salvo.telasComDica)
              ? salvo.telasComDica
                  .filter(item => typeof item === 'string')
                  .slice(0, MAXIMO_DICAS_CONTEXTO)
              : [],
          };
        }
      } catch {
        proximo = ESTADO_INICIAL;
      }
      estadoRef.current = proximo;
      setCarregado(true);
    });

    return () => { ativo = false; };
  }, [storageKey]);

  useEffect(() => {
    const atualizarTela = (): void => setTelaAtual(getCurrentRouteName());
    atualizarTela();
    return navigationRef.addListener('state', atualizarTela);
  }, []);

  useEffect(() => {
    if (
      !habilitada || !carregado || assistenteVisivel || tecladoVisivel
    ) {
      setDica(null);
      return;
    }

    const atual = estadoRef.current;
    const dataAtual = obterChaveDataLocal();
    const descobertaPendente = podeExibirDicaDescoberta(atual, dataAtual);
    const sugestao = descobertaPendente
      ? DICA_DESCOBERTA_ASSISTENTE
      : obterSugestaoContextualAssistente(telaAtual);

    if (!descobertaPendente && (
      !atual.apresentacaoVisualizada ||
      atual.totalDicasExibidas >= MAXIMO_DICAS_CONTEXTO ||
      !sugestao ||
      atual.telasComDica.includes(sugestao.id)
    )) {
      setDica(null);
      return;
    }

    if (!sugestao) return;
    let esconder: ReturnType<typeof setTimeout> | undefined;
    const mostrar = setTimeout(() => {
      setDica(sugestao);
      registrarEvento(
        descobertaPendente ? 'descoberta_exibida' : 'sugestao_exibida',
      );
      const estadoAtual = estadoRef.current;
      const proximo = descobertaPendente
        ? {
            ...estadoAtual,
            datasDicaDescobertaExibida: [
              ...new Set([
                ...estadoAtual.datasDicaDescobertaExibida,
                dataAtual,
              ]),
            ].slice(0, 2),
          }
        : {
            ...estadoAtual,
            totalDicasExibidas: Math.min(
              MAXIMO_DICAS_CONTEXTO,
              estadoAtual.totalDicasExibidas + 1,
            ),
            telasComDica: [
              ...new Set([...estadoAtual.telasComDica, sugestao.id]),
            ].slice(0, MAXIMO_DICAS_CONTEXTO),
          };
      void persistir(proximo);
      esconder = setTimeout(
        () => setDica(null),
        descobertaPendente ? DURACAO_DESCOBERTA_MS : DURACAO_CONTEXTO_MS,
      );
    }, descobertaPendente ? ATRASO_DESCOBERTA_MS : ATRASO_CONTEXTO_MS);

    return () => {
      clearTimeout(mostrar);
      if (esconder) clearTimeout(esconder);
    };
  }, [
    assistenteVisivel,
    carregado,
    habilitada,
    persistir,
    registrarEvento,
    tecladoVisivel,
    telaAtual,
  ]);

  const registrarAbertura = useCallback((): void => {
    registrarEvento('assistente_aberta');
    if (!carregado) return;

    const atual = estadoRef.current;
    const deveApresentar = habilitada && !atual.apresentacaoVisualizada;
    if (deveApresentar) {
      setApresentacaoVisivel(true);
      registrarEvento('onboarding_exibido');
    }
    if (!atual.assistenteDescoberta || deveApresentar) {
      void persistir({
        ...atual,
        assistenteDescoberta: true,
        apresentacaoVisualizada:
          atual.apresentacaoVisualizada || deveApresentar,
      });
    }
  }, [carregado, habilitada, persistir, registrarEvento]);

  const selecionarDica = useCallback((): string | null => {
    if (!dica) return null;
    registrarEvento(
      dica.tipo === 'descoberta'
        ? 'descoberta_clicada'
        : 'sugestao_clicada',
    );
    setDica(null);
    return dica.pergunta;
  }, [dica, registrarEvento]);

  const selecionarExemplo = useCallback((pergunta: string): string => {
    registrarEvento('exemplo_clicado');
    setApresentacaoVisivel(false);
    return pergunta;
  }, [registrarEvento]);

  return {
    dica: habilitada ? dica : null,
    apresentacaoVisivel: habilitada && apresentacaoVisivel,
    registrarAbertura,
    selecionarDica,
    selecionarExemplo,
    fecharApresentacao: () => setApresentacaoVisivel(false),
    registrarEvento,
  };
}