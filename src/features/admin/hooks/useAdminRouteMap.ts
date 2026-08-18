import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {AdminRouteMapData} from '../models/AdminRouteMap';
import {consultarAdminRouteMap} from '../services/adminRouteMapApi';

const LIVE_ROUTE_REFRESH_INTERVAL_MS = 15_000;

const obterMensagemErro = (erro: unknown): string => {
  const requestError = erro as StrapiRequestError;
  if (requestError.response?.status === 403) {
    return 'Seu usuário não possui acesso a este percurso.';
  }
  if (requestError.response?.status === 404) {
    return 'O trajeto não foi encontrado ou ainda não foi sincronizado.';
  }

  return requestError.response?.data?.error?.message
    ?? requestError.response?.data?.message
    ?? 'Não foi possível carregar o trajeto agora.';
};

/** Controla a consulta sob demanda e ignora respostas de um mapa já fechado. */
export default function useAdminRouteMap(codigoSessao: string | null) {
  const client = useStrapiClient();
  const [data, setData] = useState<AdminRouteMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{
    codigoSessao: string;
    message: string;
  } | null>(null);
  const requestIdRef = useRef(0);

  const carregar = useCallback(async (silent = false): Promise<void> => {
    if (!codigoSessao) return;
    const requestId = ++requestIdRef.current;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await consultarAdminRouteMap(client, codigoSessao);
      if (requestId === requestIdRef.current) {
        setData(response);
        setError(null);
      }
    } catch (erro: unknown) {
      if (requestId === requestIdRef.current) {
        setError({codigoSessao, message: obterMensagemErro(erro)});
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [client, codigoSessao]);

  useEffect(() => {
    if (!codigoSessao) {
      requestIdRef.current += 1;
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setData(null);
    void carregar(false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [carregar, codigoSessao]);

  const dataAtual = data?.codigoSessao === codigoSessao ? data : null;
  const errorAtual = error?.codigoSessao === codigoSessao
    ? error.message
    : null;

  useEffect(() => {
    if (!codigoSessao || dataAtual?.situacaoExecucao !== 'em_andamento') return;
    const onAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') void carregar(true);
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void carregar(true);
    }, LIVE_ROUTE_REFRESH_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [carregar, codigoSessao, dataAtual?.situacaoExecucao]);

  return {
    data: dataAtual,
    loading,
    refreshing,
    error: errorAtual,
    retry: () => carregar(false),
  };
}
