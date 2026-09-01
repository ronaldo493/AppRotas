import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import {useAuthContext} from '../../../core/auth/AuthContext';
import {useHistoricoContext} from '../HistoricoContext';
import useStrapiClient from '../../../core/api/strapiClient';
import {
  type FiltroHistoricoRota,
  type HistoricoVisita,
} from '../models/Historico';
import type {
  StrapiListResponse,
  StrapiRequestError,
} from '../../../core/api/strapiTypes';
import usePagination from '../../../shared/hooks/usePagination';

const PAGE_SIZE = 20;

interface UseHistoricoRotasOptions {
  loadOnMount?: boolean;
}

const getErrorMessage = (err: unknown): string => {
  const strapiError = err as StrapiRequestError;

  return (
    strapiError.response?.data?.error?.message ??
    strapiError.response?.data?.message ??
    'Não foi possível realizar a operação.'
  );
};

const getStartOfDay = (date: Date): string => {
  const startDate = new Date(date);

  startDate.setHours(0, 0, 0, 0);

  return startDate.toISOString();
};

const getEndOfDay = (date: Date): string => {
  const endDate = new Date(date);

  endDate.setHours(23, 59, 59, 999);

  return endDate.toISOString();
};

const useHistoricoRotas = (
  options: UseHistoricoRotasOptions = {},
) => {
  const {loadOnMount = true} = options;
  const conexao = useStrapiClient();
  const { user } = useAuthContext();
  const {historicosRotas, setHistoricosRotas} =
    useHistoricoContext();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroHistoricoRota>({});

  const {
    currentPage,
    nextPage,
    hasMore,
    setHasMore,
    setDataMeta,
    resetPagination,
  } = usePagination(1);

  const getHistoricoRotas = useCallback(
    async (): Promise<boolean> => {
      if (!user?.username) {
        setError('Usuário não identificado.');
        return false;
      }

      setLoading(true);
      setError(null);

      const filters: Record<string, unknown> = {};

      if (filtro.dataInicial || filtro.dataFinal) {
        filters.datahora = {
          ...(filtro.dataInicial && {
            $gte: getStartOfDay(filtro.dataInicial),
          }),
          ...(filtro.dataFinal && {
            $lte: getEndOfDay(filtro.dataFinal),
          }),
        };
      }

      try {
        const response = await conexao.get<StrapiListResponse<HistoricoVisita>>('/historico-visitas/me', {
          params: {
            filters,
            sort: ['datahora:desc'],
            pagination: {
              page: currentPage,
              pageSize: PAGE_SIZE,
            },
          },
        });

        const { data, meta } = response.data;

        setDataMeta(meta);

        setHasMore(meta.pagination.page < meta.pagination.pageCount);

        setHistoricosRotas(currentHistoricos => {
          if (currentPage === 1) return data;

          const historicosMap = new Map<string, HistoricoVisita>();

          [...currentHistoricos, ...data].forEach(
            historico => {
              const key =
                historico.documentId ??
                String(historico.id);

              historicosMap.set(key, historico);
            },
          );

          return Array.from(historicosMap.values());
        });

        return true;
      } catch (err: unknown) {
        const strapiError = err as StrapiRequestError;

        const errorMessage = getErrorMessage(err);

        setError(errorMessage);

        Toast.show({
          type: 'error',
          text1:
            strapiError.response?.status === 403
              ? 'Acesso negado'
              : 'Erro ao carregar',
          text2:
            strapiError.response?.status === 403
              ? 'Você não possui permissão para consultar o histórico.'
              : errorMessage,
        });

        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      conexao,
      currentPage,
      filtro.dataFinal,
      filtro.dataInicial,
      setDataMeta,
      setHasMore,
      setHistoricosRotas,
      user?.username,
    ],
  );

  const aplicarFiltroData = (dataInicial?: Date, dataFinal?: Date): void => {
    if (
      dataInicial &&
      dataFinal &&
      dataInicial.getTime() > dataFinal.getTime()
    ) {
      Toast.show({
        type: 'error',
        text1: 'Período inválido',
        text2: 'A data inicial não pode ser maior que a data final.',
      });

      return;
    }

    setHistoricosRotas([]);
    resetPagination();

    setFiltro({dataInicial, dataFinal});
  };

  const limparFiltroData = (): void => {
    setHistoricosRotas([]);
    resetPagination();
    setFiltro({});
  };

  const loadMore = (): void => {
    if (loading || !hasMore) return;

    nextPage();
  };

  useEffect(() => {
    if (
      !loadOnMount ||
      !user?.username
    ) {
      return;
    }

    void getHistoricoRotas();
  }, [
    getHistoricoRotas,
    loadOnMount,
    user?.username,
  ]);

  return {
    historicosRotas,
    filtro,
    error,
    loading,
    hasMore,
    loadMore,
    aplicarFiltroData,
    limparFiltroData,
    resetPagination,
    getHistoricoRotas,
  };
};

export default useHistoricoRotas;
