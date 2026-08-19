import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {AdminActiveRoutesMapData} from '../models/AdminActiveRoutesMap';
import {consultarMapaRotasAtivas} from '../services/adminActiveRoutesMapApi';

const MAP_REFRESH_INTERVAL_MS = 15_000;

const obterMensagemErro = (erro: unknown): string => {
  const requestError = erro as StrapiRequestError;
  if (requestError.response?.status === 403) {
    return 'Seu usuário não possui acesso ao mapa de rotas em andamento.';
  }
  return requestError.response?.data?.error?.message
    ?? requestError.response?.data?.message
    ?? 'Não foi possível atualizar as rotas agora.';
};

/** Preserva o último retrato útil enquanto tenta atualizar a cada 15 segundos. */
export default function useAdminActiveRoutesMap(active = true) {
  const client = useStrapiClient();
  const [data, setData] = useState<AdminActiveRoutesMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  const carregar = useCallback(async (silent = false): Promise<void> => {
    if (!active || runningRef.current) return;
    runningRef.current = true;
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await consultarMapaRotasAtivas(client);
      if (!mountedRef.current) return;
      setData(response);
      setError(null);
    } catch (requestError: unknown) {
      if (mountedRef.current) setError(obterMensagemErro(requestError));
    } finally {
      runningRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [active, client]);

  useEffect(() => {
    mountedRef.current = true;
    if (active) void carregar(false);
    return () => {
      mountedRef.current = false;
    };
  }, [active, carregar]);

  useEffect(() => {
    if (!active) return;
    const onAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') void carregar(true);
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void carregar(true);
    }, MAP_REFRESH_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [active, carregar]);

  return {
    data,
    loading,
    refreshing,
    error,
    retry: () => carregar(false),
    refresh: () => carregar(true),
  };
}
