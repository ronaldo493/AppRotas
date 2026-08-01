import {useCallback, useEffect, useRef, useState} from 'react';
import type {AxiosInstance} from 'axios';

import {useAuthContext} from '../../../core/auth/AuthContext';
import {usePontosContext} from '../PontosContext';
import useStrapiClient from '../../../core/api/strapiClient';
import type {
  NovoPonto,
  NovoPontoInput,
  PontoInteresse,
} from '../models/Ponto';
import type {
  StrapiListResponse,
  StrapiRequestError,
  StrapiSingleResponse,
} from '../../../core/api/strapiTypes';

const PAGE_SIZE = 100;

interface PendingPontosRequest {
  token: string | null;
  promise: Promise<PontoInteresse[]>;
}

let pendingPontosRequest: PendingPontosRequest | null = null;

const fetchAllPontos = async (
  conexao: AxiosInstance,
): Promise<PontoInteresse[]> => {
  const allPontos: PontoInteresse[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await conexao.get<StrapiListResponse<PontoInteresse>>(
      '/pontos-interesses',
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

    allPontos.push(...data);
    totalPages = meta.pagination.pageCount;
    currentPage += 1;
  } while (currentPage <= totalPages);

  return allPontos;
};

interface UsePontosOptions {
  loadOnMount?: boolean;
}

interface UsePontosReturn {
  pontos: PontoInteresse[];
  error: string | null;
  loading: boolean;
  getPontos: () => Promise<PontoInteresse[] | null>;
  postPontos: (novoPonto: NovoPontoInput) => Promise<PontoInteresse>;
}

const getErrorMessage = (error: unknown): string => {
  const requestError = error as StrapiRequestError;

  return (
    requestError.response?.data?.error?.message ??
    requestError.response?.data?.message ??
    'Não foi possível carregar os pontos de interesse.'
  );
};

export default function usePontos(
  options: UsePontosOptions = {},
): UsePontosReturn {
  const {loadOnMount = true} = options;
  const conexao = useStrapiClient();
  const {token, user} = useAuthContext();
  const {pontos, setPontos} = usePontosContext();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestingRef = useRef(false);

  /*
   * Todas as páginas são acumuladas fora do estado. Assim o mapa
   * recebe uma única atualização, em vez de remontar marcadores
   * depois de cada resposta da API.
   */
  const getPontos = useCallback(async (): Promise<PontoInteresse[] | null> => {
    if (requestingRef.current) {
      const requestEmAndamento = pendingPontosRequest;

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

    try {
      if (!pendingPontosRequest || pendingPontosRequest.token !== token) {
        const promise = fetchAllPontos(conexao);
        const request = {token, promise};

        pendingPontosRequest = request;
        void promise.then(
          () => {
            if (pendingPontosRequest === request) pendingPontosRequest = null;
          },
          () => {
            if (pendingPontosRequest === request) pendingPontosRequest = null;
          },
        );
      }

      const activeRequest = pendingPontosRequest;
      if (!activeRequest) return null;

      const allPontos = await activeRequest.promise;

      setPontos(allPontos);
      return allPontos;
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      return null;
    } finally {
      requestingRef.current = false;
      setLoading(false);
    }
  }, [conexao, setPontos, token]);

  const postPontos = useCallback(
    async (novoPontoInput: NovoPontoInput): Promise<PontoInteresse> => {
      if (!user?.username) {
        throw new Error(
          'Usuário não identificado. Faça login novamente.',
        );
      }

      const novoPonto: NovoPonto = {
        ...novoPontoInput,
        usernameCriador: user.username,
        setorCriador:
          user.setor?.trim() || 'Não informado',
      };

      const response = await conexao.post<
        StrapiSingleResponse<PontoInteresse>
      >('/pontos-interesses', {
        data: novoPonto,
      });
      const savedPonto = response.data.data;

      setPontos(current => {
        const savedKey =
          savedPonto.documentId ?? String(savedPonto.id ?? '');
        const alreadyExists =
          savedKey.length > 0 &&
          current.some(ponto => {
            const currentKey =
              ponto.documentId ?? String(ponto.id ?? '');

            return currentKey === savedKey;
          });

        return alreadyExists
          ? current
          : [...current, savedPonto];
      });

      return savedPonto;
    },
    [conexao, setPontos, user?.setor, user?.username],
  );

  useEffect(() => {
    if (!loadOnMount || pontos.length > 0) return;

    void getPontos();
  }, [getPontos, loadOnMount, pontos.length]);

  return {
    pontos,
    error,
    loading,
    getPontos,
    postPontos,
  };
}
