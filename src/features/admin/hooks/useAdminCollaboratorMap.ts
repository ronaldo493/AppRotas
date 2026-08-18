import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {AdminCollaboratorMapData} from '../models/AdminCollaboratorMap';
import {consultarAdminCollaboratorMap} from '../services/adminCollaboratorMapApi';

const MAP_REFRESH_INTERVAL_MS = 30_000;

const obterMensagemErro = (erro: unknown): string => {
  const requestError = erro as StrapiRequestError;
  if (requestError.response?.status === 403) {
    return 'Seu usuário não possui acesso ao mapa de colaboradores.';
  }
  return requestError.response?.data?.error?.message
    ?? requestError.response?.data?.message
    ?? 'Não foi possível atualizar as posições agora.';
};

/** Mantém os últimos dados visíveis quando uma atualização silenciosa falha. */
export default function useAdminCollaboratorMap(active = true) {
  const client = useStrapiClient();
  const [data, setData] = useState<AdminCollaboratorMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  const carregar = useCallback(async (silent = false): Promise<void> => {
    if (!active || runningRef.current) return;
    runningRef.current = true;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await consultarAdminCollaboratorMap(client);
      if (!mountedRef.current) return;
      setData(response);
      setError(null);
    } catch (erro: unknown) {
      if (!mountedRef.current) return;
      setError(obterMensagemErro(erro));
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
