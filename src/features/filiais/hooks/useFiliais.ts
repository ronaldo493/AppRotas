import {useCallback, useEffect, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';
import type {AxiosInstance} from 'axios';

import {useFiliaisContext} from '../FiliaisContext';
import {useAuthContext} from '../../../core/auth/AuthContext';
import useStrapiClient from '../../../core/api/strapiClient';
import type {Filial} from '../models/Filial';
import type {
  StrapiListResponse,
  StrapiRequestError,
} from '../../../core/api/strapiTypes';

const PAGE_SIZE = 100;

interface PendingFiliaisRequest {
  token: string | null;
  promise: Promise<Filial[]>;
}

let pendingFiliaisRequest: PendingFiliaisRequest | null = null;

interface UseFiliaisReturn {
  filiais: Filial[];
  error: string | null;
  errorStatus: number | null;
  loading: boolean;
  getFiliais: (showErrorToast?: boolean) => Promise<Filial[] | null>;
}

interface UseFiliaisOptions {
  showErrorToast?: boolean;
}

const getErrorMessage = (error: unknown): string => {
  const strapiError = error as StrapiRequestError;

  return (
    strapiError.response?.data?.error?.message ??
    strapiError.response?.data?.message ??
    'Não foi possível carregar as informações das lojas.'
  );
};

const fetchAllFiliais = async (
  conexao: AxiosInstance,
): Promise<Filial[]> => {
  const allFiliais: Filial[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response =
      await conexao.get<StrapiListResponse<Filial>>(
        '/informacoeslojas',
        {
          params: {
            pagination: {
              page: currentPage,
              pageSize: PAGE_SIZE,
            },
          },
        },
      );
    const {data, meta} = response.data;

    allFiliais.push(...data);
    totalPages = meta.pagination.pageCount;
    currentPage += 1;
  } while (currentPage <= totalPages);

  return allFiliais;
};

export default function useFiliais(
  options: UseFiliaisOptions = {},
): UseFiliaisReturn {
  const {showErrorToast = true} = options;
  const conexao = useStrapiClient();
  const {token} = useAuthContext();

  const {filiais, setFiliais} = useFiliaisContext();

  const [error, setError] =  useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /*
   * Evita duas buscas simultâneas caso mais de um
   * componente execute getFiliais ao mesmo tempo.
   */
  const requestingRef = useRef(false);

  const getFiliais = useCallback(async (shouldShowErrorToast = true): Promise<Filial[] | null> => {
      if (requestingRef.current) {
        const requestEmAndamento = pendingFiliaisRequest;

        if (requestEmAndamento?.token !== token) return null;

        try {
          return await requestEmAndamento.promise;
        } catch {
          return null;
        }
      }

      requestingRef.current = true;
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      try {
        if (
          !pendingFiliaisRequest ||
          pendingFiliaisRequest.token !== token
        ) {
          const promise = fetchAllFiliais(conexao);
          const request = {token, promise};

          pendingFiliaisRequest = request;
          const clearPendingRequest = (): void => {
            if (pendingFiliaisRequest === request) {
              pendingFiliaisRequest = null;
            }
          };

          void promise.then(
            clearPendingRequest,
            clearPendingRequest,
          );
        }

        const activeRequest = pendingFiliaisRequest;

        if (!activeRequest) return null;

        const allFiliais = await activeRequest.promise;

        setFiliais(allFiliais);

        return allFiliais;
      } catch (err: unknown) {
        const strapiError = err as StrapiRequestError;

        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setErrorStatus(strapiError.response?.status ?? null);

        if (shouldShowErrorToast) {
          const accessDenied = strapiError.response?.status === 403;

          Toast.show({
            type: 'error',
            text1: accessDenied
              ? 'Acesso negado'
              : 'Erro ao carregar lojas',
            text2: accessDenied
              ? 'Você não possui permissão para consultar as informações das lojas.'
              : errorMessage,
          });
        }

        return null;
      } finally {
        requestingRef.current = false;
        setLoading(false);
      }
    },
    [conexao, setFiliais, token],
  );

  /*
   * Evita buscar novamente caso as filiais já estejam
   * armazenadas no contexto.
   */
  useEffect(() => {
    if (filiais.length > 0) {
      return;
    }

    void getFiliais(showErrorToast);
  }, [filiais.length, getFiliais, showErrorToast]);

  return {
    filiais,
    error,
    errorStatus,
    loading,
    getFiliais,
  };
}
