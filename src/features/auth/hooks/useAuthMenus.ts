import { useCallback } from 'react';

import type {AuthUser} from '../../../core/auth/AuthContext';
import type {AuthMenu} from '../../../core/auth/AuthMenu';
import useStrapiClient from '../../../core/api/strapiClient';

// Setor relacionado a um menu no Strapi.
interface MenuSetor {
  titulo?: string | null;
}

// Estrutura do menu retornado pelo Strapi.
interface Menu extends AuthMenu {
  titulo: string;
  rota: string;
  ativo: boolean;
  ordem: number;
  icone?: string | null;
  setors?: MenuSetor[];
}

// Estrutura da resposta da consulta de menus.
interface MenusResponse {
  data: Menu[];
}

// Usuário autenticado acrescido dos menus permitidos.
interface UserWithMenus extends AuthUser {
  menus: AuthMenu[];
}

const lastSuccessfulLoadByUser = new Map<string, number>();

const getUserCacheKey = (user: AuthUser): string => {
  if (typeof user.documentId === 'string' && user.documentId) {
    return `document:${user.documentId}`;
  }

  if (typeof user.id === 'number') {
    return `id:${user.id}`;
  }

  return `username:${user.username ?? ''}`;
};

export const wasMenuAccessLoadedRecently = (
  user: AuthUser,
  maxAgeMs: number,
): boolean => {
  const loadedAt =
    lastSuccessfulLoadByUser.get(getUserCacheKey(user));

  return typeof loadedAt === 'number'
    && Date.now() - loadedAt < maxAgeMs;
};

const useAuthMenus = () => {
  const conexao = useStrapiClient();

  const loadAllowedMenus = useCallback(async (
    jwt: string,
    user: AuthUser,
  ): Promise<AuthMenu[]> => {
    // Normaliza os dados para evitar diferenças entre maiúsculas, minúsculas e espaços.
    const setor = typeof user.setor === 'string' ? user.setor.trim().toLowerCase() : '';
    const cargo = typeof user.cargo === 'string' ? user.cargo.trim().toUpperCase() : '';

    // Usa explicitamente o JWT recebido no login, pois o contexto pode ainda não ter sido atualizado.
    const response = await conexao.get<MenusResponse>('/menus?populate=setors', {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const menusFiltrados = response.data.data
      .filter(menu => {
        // ADMIN possui acesso a todos os menus.
        if (cargo === 'ADMIN') return true;

        // Verifica se o menu está vinculado ao setor do usuário.
        const setorMatch = menu.setors?.some(
          setorMenu => setorMenu.titulo?.trim().toLowerCase() === setor,
        ) ?? false;

        // Identifica o menu administrativo.
        const isAdminMenu = menu.titulo.trim().toLowerCase() === 'admin';

        // GESTOR acessa os menus do próprio setor e também o menu Admin.
        if (cargo === 'GESTOR') return setorMatch || isAdminMenu;

        // Usuário comum acessa apenas menus ativos vinculados ao próprio setor.
        return setorMatch && menu.ativo === true;
      })
      // Remove a relação de setores antes de salvar os menus no usuário.
      .map(({ titulo, rota, ativo, ordem, icone }) => ({
        titulo,
        rota,
        ativo,
        ordem,
        icone,
      }));

    lastSuccessfulLoadByUser.set(
      getUserCacheKey(user),
      Date.now(),
    );

    return menusFiltrados;
  }, [conexao]);

  /**
   * Busca os menus no Strapi e aplica as permissões de acordo
   * com o cargo e o setor do usuário autenticado.
   */
  const loadUserWithMenus = useCallback(async (jwt: string, user: AuthUser): Promise<UserWithMenus> => {
    try {
      const menusFiltrados = await loadAllowedMenus(jwt, user);

      return { ...user, menus: menusFiltrados };
    } catch (error: unknown) {
      console.error(
        'Erro ao carregar menus:',
        error instanceof Error ? error.message : 'erro desconhecido',
      );

      // Mantém o acesso já conhecido se uma atualização falhar.
      return { ...user, menus: user.menus ?? [] };
    }
  }, [loadAllowedMenus]);

  return {
    loadAllowedMenus,
    loadUserWithMenus,
  };
};

export default useAuthMenus;
