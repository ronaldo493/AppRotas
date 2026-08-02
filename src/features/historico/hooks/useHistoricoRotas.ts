import { useCallback, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

import {useAuthContext} from '../../../core/auth/AuthContext';
import {useHistoricoContext} from '../HistoricoContext';
import useStrapiClient from '../../../core/api/strapiClient';
import type {Filial} from '../../filiais/models/Filial';
import {
  TIPO_HISTORICO,
  type FiltroHistoricoRota,
  type HistoricoVisita,
  type NovoHistoricoRota,
  type TipoHistorico,
} from '../models/Historico';
import type {
  StrapiListResponse,
  StrapiRequestError,
  StrapiSingleResponse,
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

  const postHistoricoRota = useCallback(
    async (
      routes: Filial[],
      datahora = new Date().toISOString(),
      showErrorToast = true,
      cidadeOrigem: string | null,
      tipoHistorico: TipoHistorico =
        TIPO_HISTORICO.LOJA,
    ): Promise<boolean> => {
      if (!user) {
        const message = 'Usuário não identificado. Faça login novamente.';

        setError(message);

        if (showErrorToast) {
          Toast.show({
            type: 'error',
            text1: 'Usuário não identificado',
            text2: message,
          });
        }

        return false;
      }

      if (routes.length === 0) {
        const message ='Nenhuma filial foi adicionada à rota.';

        setError(message);

        if (showErrorToast) {
          Toast.show({
            type: 'error',
            text1: 'Rota vazia',
            text2: message,
          });
        }

        return false;
      }

      setLoading(true);
      setError(null);

      const novoHistorico: NovoHistoricoRota = {
        datahora,
        username: user.username ?? 'Não informado',
        setor: user.setor ?? 'Não informado',
        cidadeOrigem: cidadeOrigem ?? 'Não informado',
        tipoHistorico,
        rotas: routes.map((route, index) => ({
          codigofilial: route.codigofilial,
          nomefilial: route.nomefilial,
          nomecidade: route.nomecidade,
          ordem: index + 1,
        })),
      };

      try {
        const response = await conexao.post<
          StrapiSingleResponse<HistoricoVisita>
        >('/historico-visitas', {
          data: novoHistorico,
        });
        const historicoSalvo = response.data.data;

        setHistoricosRotas(currentHistoricos =>
          [historicoSalvo, ...currentHistoricos].sort(
            (a, b) =>
              new Date(b.datahora).getTime() -
              new Date(a.datahora).getTime(),
          ),
        );

        return true;
      } catch (err: unknown) {
        const strapiError = err as StrapiRequestError;

        const errorMessage = getErrorMessage(err);

        setError(errorMessage);

        if (showErrorToast) {
          Toast.show({
            type: 'error',
            text1:
              strapiError.response?.status === 403
                ? 'Acesso negado'
                : 'Erro ao salvar',
            text2:
              strapiError.response?.status === 403
                ? 'Você não possui permissão para salvar o histórico.'
                : errorMessage,
          });
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [conexao, setHistoricosRotas, user],
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
    postHistoricoRota,
  };
};

export default useHistoricoRotas;
