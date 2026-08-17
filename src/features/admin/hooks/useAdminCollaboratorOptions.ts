import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {UsuarioAdministravel} from '../models/AdminPasswordManagement';
import {consultarUsuariosAdministrativos} from '../services/adminUsersApi';

const TAMANHO_PAGINA = 50;
const ATRASO_BUSCA_MS = 250;

/**
 * Pagina o diretório autorizado pelo Strapi. ADMIN recebe todos os setores e
 * GESTOR somente o próprio setor, sem o aplicativo informar esse escopo.
 */
export default function useAdminCollaboratorOptions(
  enabled: boolean,
  busca: string,
) {
  const client = useStrapiClient();
  const [usuarios, setUsuarios] = useState<UsuarioAdministravel[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  const consultarPagina = useCallback(async (
    paginaSolicitada: number,
    modo: 'inicial' | 'mais',
  ): Promise<void> => {
    const requestId = ++requestIdRef.current;
    if (modo === 'inicial') setLoading(true);
    if (modo === 'mais') setLoadingMore(true);
    setError(false);

    try {
      const resposta = await consultarUsuariosAdministrativos(client, {
        ...(busca.trim() ? {busca: busca.trim()} : {}),
        pagina: paginaSolicitada,
        tamanhoPagina: TAMANHO_PAGINA,
      });
      if (requestId !== requestIdRef.current) return;

      setUsuarios(atuais => {
        if (modo === 'inicial') return resposta.usuarios;
        const unicos = new Map(atuais.map(usuario => [usuario.id, usuario]));
        resposta.usuarios.forEach(usuario => unicos.set(usuario.id, usuario));
        return [...unicos.values()];
      });
      setPagina(resposta.paginacao.pagina);
      setTotalPaginas(resposta.paginacao.totalPaginas);
    } catch {
      if (requestId === requestIdRef.current) {
        if (modo === 'inicial') setUsuarios([]);
        setError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [busca, client]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      return;
    }

    requestIdRef.current += 1;
    const timer = setTimeout(() => {
      void consultarPagina(1, 'inicial');
    }, busca.trim() ? ATRASO_BUSCA_MS : 0);

    return () => clearTimeout(timer);
  }, [busca, consultarPagina, enabled]);

  const carregarMais = useCallback((): void => {
    if (!enabled || loading || loadingMore || pagina >= totalPaginas) return;
    void consultarPagina(pagina + 1, 'mais');
  }, [consultarPagina, enabled, loading, loadingMore, pagina, totalPaginas]);

  return {
    usuarios,
    loading,
    loadingMore,
    error,
    carregarMais,
    tentarNovamente: () => consultarPagina(1, 'inicial'),
  };
}
