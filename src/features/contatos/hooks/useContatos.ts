import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiListResponse, StrapiRequestError} from '../../../core/api/strapiTypes';
import type {Contato} from '../models/Contato';

const PAGE_SIZE = 100;

interface UseContatosOptions {
  loadOnMount?: boolean;
}

interface UseContatosReturn {
  contatos: Contato[];
  loading: boolean;
  error: string | null;
  recarregar: () => Promise<Contato[] | null>;
}

const obterMensagemErro = (error: unknown): string => {
  const requestError = error as StrapiRequestError;

  return requestError.response?.data?.error?.message ??
    requestError.response?.data?.message ??
    'Não foi possível carregar os contatos.';
};

const ordenarContatos = (first: Contato, second: Contato): number => {
  const departamento = first.departamento.localeCompare(second.departamento, 'pt-BR');

  return departamento !== 0
    ? departamento
    : first.colaboradores.localeCompare(second.colaboradores, 'pt-BR');
};

export default function useContatos(
  options: UseContatosOptions = {},
): UseContatosReturn {
  const {loadOnMount = true} = options;
  const client = useStrapiClient();
  const requestingRef = useRef(false);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<Contato[] | null> => {
    if (requestingRef.current) return null;

    requestingRef.current = true;
    setLoading(true);
    setError(null);

    const todosContatos: Contato[] = [];
    let page = 1;
    let pageCount = 1;

    try {
      do {
        const response = await client.get<StrapiListResponse<Contato>>('/contatos', {
          params: {pagination: {page, pageSize: PAGE_SIZE}},
        });

        todosContatos.push(...response.data.data);
        pageCount = response.data.meta.pagination.pageCount;
        page += 1;
      } while (page <= pageCount);

      const contatosUnicos = new Map<string, Contato>();

      todosContatos.forEach(contato => {
        const key = contato.documentId ?? String(contato.id ?? [
          contato.departamento,
          contato.colaboradores,
          contato.ramal,
          contato.ddr,
        ].join('|'));

        contatosUnicos.set(key, contato);
      });

      const contatosOrdenados =
        Array.from(contatosUnicos.values()).sort(ordenarContatos);

      setContatos(contatosOrdenados);
      return contatosOrdenados;
      
    } catch (requestError: unknown) {
      setError(obterMensagemErro(requestError));
      return null;

    } finally {
      requestingRef.current = false;
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (!loadOnMount) return;

    void recarregar();
  }, [loadOnMount, recarregar]);

  return {contatos, loading, error, recarregar};
}
