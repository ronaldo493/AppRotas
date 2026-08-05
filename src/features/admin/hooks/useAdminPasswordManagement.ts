import {useCallback, useEffect, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {
  PaginaUsuariosAdministrativos,
  UsuarioAdministravel,
} from '../models/AdminPasswordManagement';
import {
  consultarUsuariosAdministrativos,
  redefinirSenhaAdministrativa,
} from '../services/adminPasswordManagementApi';

const TAMANHO_PAGINA = 20;

const obterMensagemErro = (error: unknown): string => {
  const requestError = error as StrapiRequestError;
  if (requestError.response?.status === 403) {
    return 'Seu usuário não possui acesso a esta função.';
  }

  return requestError.response?.data?.error?.message
    ?? requestError.response?.data?.message
    ?? 'Não foi possível concluir a operação agora.';
};

/** Coordena busca, paginação e redefinição sem expor senha ou escopo no app. */
export default function useAdminPasswordManagement() {
  const client = useStrapiClient();
  const [busca, setBusca] = useState('');
  const [dados, setDados] = useState<PaginaUsuariosAdministrativos | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [redefinindoId, setRedefinindoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const consultarPagina = useCallback(async (
    pagina: number,
    modo: 'inicial' | 'atualizar' | 'mais',
  ): Promise<void> => {
    const requestId = ++requestIdRef.current;
    if (modo === 'inicial') setLoading(true);
    if (modo === 'atualizar') setRefreshing(true);
    if (modo === 'mais') setLoadingMore(true);
    setError(null);

    try {
      const resposta = await consultarUsuariosAdministrativos(client, {
        ...(busca ? {busca} : {}),
        pagina,
        tamanhoPagina: TAMANHO_PAGINA,
      });
      if (requestId !== requestIdRef.current) return;

      if (modo !== 'mais') {
        setDados(resposta);
        return;
      }

      setDados(atual => {
        if (!atual) return resposta;
        const usuarios = new Map(
          atual.usuarios.map(usuario => [usuario.id, usuario]),
        );
        resposta.usuarios.forEach(usuario => usuarios.set(usuario.id, usuario));

        return {
          ...resposta,
          usuarios: [...usuarios.values()],
        };
      });
    } catch (requestError: unknown) {
      if (requestId === requestIdRef.current) {
        setError(obterMensagemErro(requestError));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, [busca, client]);

  useEffect(() => {
    void consultarPagina(1, 'inicial');
  }, [consultarPagina]);

  const carregarMais = useCallback((): void => {
    if (!dados || loading || refreshing || loadingMore) return;
    if (dados.paginacao.pagina >= dados.paginacao.totalPaginas) return;
    void consultarPagina(dados.paginacao.pagina + 1, 'mais');
  }, [consultarPagina, dados, loading, loadingMore, refreshing]);

  const redefinirSenha = useCallback(async (
    usuario: UsuarioAdministravel,
  ): Promise<boolean> => {
    if (redefinindoId !== null) return false;
    setRedefinindoId(usuario.id);

    try {
      const atualizado = await redefinirSenhaAdministrativa(client, usuario.id);
      setDados(atual => atual
        ? {
            ...atual,
            usuarios: atual.usuarios.map(item => (
              item.id === atualizado.id ? atualizado : item
            )),
          }
        : atual);
      Toast.show({
        type: 'success',
        text1: 'Senha redefinida',
        text2: `${atualizado.username} deverá criar uma nova senha no próximo acesso.`,
      });
      return true;
    } catch (requestError: unknown) {
      Toast.show({
        type: 'error',
        text1: 'Não foi possível redefinir',
        text2: obterMensagemErro(requestError),
      });
      return false;
    } finally {
      setRedefinindoId(null);
    }
  }, [client, redefinindoId]);

  return {
    busca,
    dados,
    loading,
    refreshing,
    loadingMore,
    redefinindoId,
    error,
    setBusca,
    atualizar: () => consultarPagina(1, 'atualizar'),
    carregarMais,
    tentarNovamente: () => consultarPagina(1, 'inicial'),
    redefinirSenha,
  };
}
