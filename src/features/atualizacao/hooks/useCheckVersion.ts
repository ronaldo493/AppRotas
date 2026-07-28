import Constants from 'expo-constants';
import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError, StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {AtualizacaoApp} from '../models/AtualizacaoApp';
import {versaoMaisRecenteDisponivel} from '../useCases/avaliarAtualizacao';

const CURRENT_VERSION = Constants.expoConfig?.version ?? '0.0.0';

interface UseCheckVersionReturn {
  currentVersion: string;
  availableUpdate: AtualizacaoApp | null;
  loading: boolean;
  error: string | null;
  checkVersion: () => Promise<boolean>;
}

const obterMensagemErro = (error: unknown): string => {
  const requestError = error as StrapiRequestError;

  return requestError.response?.data?.error?.message ??
    requestError.response?.data?.message ??
    'Não foi possível verificar a versão do aplicativo.';
};

export default function useCheckVersion(): UseCheckVersionReturn {
  const client = useStrapiClient();
  const requestingRef = useRef(false);
  const [availableUpdate, setAvailableUpdate] = useState<AtualizacaoApp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkVersion = useCallback(async (): Promise<boolean> => {
    if (requestingRef.current) return false;

    requestingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await client.get<StrapiSingleResponse<AtualizacaoApp>>(
        '/update-app?populate=appApk',
      );
      const update = response.data.data;
      const hasUpdate = Boolean(
        update?.versao &&
        versaoMaisRecenteDisponivel(update.versao, CURRENT_VERSION),
      );

      setAvailableUpdate(hasUpdate ? update : null);
      return hasUpdate;
    } catch (requestError: unknown) {
      setError(obterMensagemErro(requestError));
      return false;
    } finally {
      requestingRef.current = false;
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void checkVersion();
  }, [checkVersion]);

  return {currentVersion: CURRENT_VERSION, availableUpdate, loading, error, checkVersion};
}
