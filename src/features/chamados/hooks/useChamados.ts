import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiListResponse} from '../../../core/api/strapiTypes';
import {useAuthContext} from '../../../core/auth/AuthContext';
import {useChamadosContext} from '../ChamadosContext';
import type {Chamado} from '../models/Chamado';

const PAGE_SIZE = 100;

interface UseChamadosOptions {
  loadOnMount?: boolean;
}

interface UseChamadosReturn {
  chamados: Chamado[];
  error: string | null;
  loading: boolean;
  reload: () => Promise<Chamado[] | null>;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : 'Não foi possível carregar os chamados.';

export default function useChamados(
  options: UseChamadosOptions = {},
): UseChamadosReturn {
  const {loadOnMount = true} = options;
  const client = useStrapiClient();
  const {user} = useAuthContext();
  const {chamados, setChamados} = useChamadosContext();
  const requestingRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (): Promise<Chamado[] | null> => {
    if (
      requestingRef.current ||
      !user?.username
    ) {
      return null;
    }

    requestingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const allTickets: Chamado[] = [];
      let page = 1;
      let pageCount = 1;

      do {
        const response = await client.get<
          StrapiListResponse<Chamado>
        >('/chamados', {
          params: {
            pagination: {
              page,
              pageSize: PAGE_SIZE,
            },
            filters: {
              $or: [
                {
                  nomeresponsavel: {
                    $eq: user.username,
                  },
                },
                {
                  $and: [
                    {
                      descricaosetorresponsavel: {
                        $eq: user.setor,
                      },
                    },
                    {
                      $or: [
                        {
                          nomeresponsavel: {
                            $eq: '',
                          },
                        },
                        {
                          nomeresponsavel: {
                            $null: true,
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        });

        allTickets.push(...response.data.data);
        pageCount =
          response.data.meta.pagination.pageCount;
        page += 1;
      } while (page <= pageCount);

      const uniqueTickets = new Map<
        string,
        Chamado
      >();

      allTickets.forEach(ticket => {
        const key =
          ticket.documentId ??
          String(ticket.sequencia);

        uniqueTickets.set(key, ticket);
      });

      const chamadosCarregados = Array.from(uniqueTickets.values());

      setChamados(chamadosCarregados);

      return chamadosCarregados;
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      return null;
    } finally {
      requestingRef.current = false;
      setLoading(false);
    }
  }, [
    client,
    setChamados,
    user?.setor,
    user?.username,
  ]);

  useEffect(() => {
    if (!loadOnMount) return;

    void reload();
  }, [loadOnMount, reload]);

  return {
    chamados,
    error,
    loading,
    reload,
  };
}
