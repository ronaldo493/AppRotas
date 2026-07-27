import {useCallback, useEffect, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';

import { useStrapiContext } from '../context/StrapiContext';
import useStrapiClient from '../services/StrapiClient';
import type { Filial } from '../type/Filial';
import type {StrapiListResponse, StrapiRequestError} from '../type/Strapi';

const PAGE_SIZE = 100;

interface UseFiliaisReturn {
  filiais: Filial[];
  error: string | null;
  loading: boolean;
  getFiliais: (showErrorToast?: boolean) => Promise<boolean>;
}

const getErrorMessage = (error: unknown): string => {
  const strapiError = error as StrapiRequestError;

  return (
    strapiError.response?.data?.error?.message ??
    strapiError.response?.data?.message ??
    'Não foi possível carregar as informações das lojas.'
  );
};

export default function useFiliais(): UseFiliaisReturn {
  const conexao = useStrapiClient();

  const {filiais, setFiliais} = useStrapiContext();

  const [error, setError] =  useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /*
   * Evita duas buscas simultâneas caso mais de um
   * componente execute getFiliais ao mesmo tempo.
   */
  const requestingRef = useRef(false);

  const getFiliais = useCallback(async (showErrorToast = true): Promise<boolean> => {
      if (requestingRef.current)  return false;

      requestingRef.current = true;
      setLoading(true);
      setError(null);

      const allFiliais: Filial[] = [];

      let currentPage = 1;
      let totalPages = 1;

      try {
        do {
          const response = await conexao.get<StrapiListResponse<Filial>>('/informacoeslojas', {
            params: {
              pagination: {
                page: currentPage,
                pageSize: PAGE_SIZE,
              },
            },
          });

          const {data, meta} = response.data;

          allFiliais.push(...data);

          totalPages = meta.pagination.pageCount;

          currentPage += 1;
        } while (currentPage <= totalPages);

        setFiliais(allFiliais);

        return true;
      } catch (err: unknown) {
        const strapiError = err as StrapiRequestError;

        const errorMessage = getErrorMessage(err);
        setError(errorMessage);

        if (showErrorToast) {
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

        return false;
      } finally {
        requestingRef.current = false;
        setLoading(false);
      }
    },
    [conexao, setFiliais],
  );

  /*
   * Evita buscar novamente caso as filiais já estejam
   * armazenadas no contexto.
   */
  useEffect(() => {
    if (filiais.length > 0) {
      return;
    }

    void getFiliais();
  }, [filiais.length, getFiliais]);

  return {
    filiais,
    error,
    loading,
    getFiliais,
  };
}