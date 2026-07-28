import {useCallback, useEffect, useRef, useState} from 'react';

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

interface UsePontosReturn {
  pontos: PontoInteresse[];
  error: string | null;
  loading: boolean;
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

export default function usePontos(): UsePontosReturn {
  const conexao = useStrapiClient();
  const {user} = useAuthContext();
  const {pontos, setPontos} = usePontosContext();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestingRef = useRef(false);

  /*
   * Todas as páginas são acumuladas fora do estado. Assim o mapa
   * recebe uma única atualização, em vez de remontar marcadores
   * depois de cada resposta da API.
   */
  const getPontos = useCallback(async (): Promise<boolean> => {
    if (requestingRef.current) return false;

    requestingRef.current = true;
    setLoading(true);
    setError(null);

    const allPontos: PontoInteresse[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
      do {
        const response =
          await conexao.get<StrapiListResponse<PontoInteresse>>(
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

      setPontos(allPontos);
      return true;
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      return false;
    } finally {
      requestingRef.current = false;
      setLoading(false);
    }
  }, [conexao, setPontos]);

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
    [conexao, setPontos, user?.username],
  );

  useEffect(() => {
    if (pontos.length > 0) return;

    void getPontos();
  }, [getPontos, pontos.length]);

  return {
    pontos,
    error,
    loading,
    postPontos,
  };
}
