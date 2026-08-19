import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../core/api/strapiClient';
import {
  obterDisponibilidadeAssistente,
  type DisponibilidadeAssistente,
} from '../services/configuracaoAssistenteService';

interface UseDisponibilidadeAssistenteReturn {
  habilitado: boolean;
  iaHabilitada: boolean;
  orquestradorHabilitado: boolean;
  sugestoesHabilitadas: boolean;
  carregando: boolean;
  origem: DisponibilidadeAssistente['origem'] | null;
  atualizar: () => Promise<void>;
}

const REFRESH_INTERVAL_MS = 5 * 60_000;

/** Mantém a chave administrativa atualizada durante a sessão autenticada. */
export default function useDisponibilidadeAssistente(): UseDisponibilidadeAssistenteReturn {
  const client = useStrapiClient();
  const [result, setResult] = useState<DisponibilidadeAssistente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const mountedRef = useRef(true);

  const atualizar = useCallback(async (): Promise<void> => {
    const next = await obterDisponibilidadeAssistente(client, {force: true});
    if (!mountedRef.current) return;

    setResult(next);
    setCarregando(false);
  }, [client]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    void obterDisponibilidadeAssistente(client).then(next => {
      if (!active) return;
      setResult(next);
      setCarregando(false);
    });

    const handleAppState = (state: AppStateStatus): void => {
      if (state === 'active') void atualizar();
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void atualizar();
    }, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      mountedRef.current = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, [atualizar, client]);

  return {
    habilitado: result?.habilitado === true,
    iaHabilitada:
      result?.habilitado === true && result?.iaHabilitada === true,
    orquestradorHabilitado:
      result?.habilitado === true && result?.orquestradorHabilitado === true,
    sugestoesHabilitadas:
      result?.habilitado === true && result?.sugestoesHabilitadas === true,
    carregando,
    origem: result?.origem ?? null,
    atualizar,
  };
}
