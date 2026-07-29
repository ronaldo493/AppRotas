import {useCallback} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import {type AuthUser} from '../../../core/auth/AuthContext';
import type {MenuItem} from '../../../core/menu/Menu';
import {markMenuAccessLoaded} from '../services/menuAccessCache';
import {buscarMenus} from '../services/menuService';
import {filtrarMenusPermitidos} from '../useCases/filtrarMenusPermitidos';

interface UserWithMenus extends AuthUser {
  menus: MenuItem[];
}

/**
 * Integra o fluxo de menus com React: consulta o Strapi, aplica as regras de
 * acesso e acrescenta os menus permitidos ao usuário autenticado.
 */
export default function useAuthMenus() {
  const client = useStrapiClient();

  const loadAllowedMenus = useCallback(async (jwt: string, user: AuthUser): Promise<MenuItem[]> => {
    const records = await buscarMenus(client, jwt);
    const menus = filtrarMenusPermitidos(records, user);

    markMenuAccessLoaded(user);

    return menus;
  }, [client]);

  const loadUserWithMenus = useCallback(async (jwt: string, user: AuthUser): Promise<UserWithMenus> => {
    try {
      const menus = await loadAllowedMenus(jwt, user);

      return {
        ...user,
        menus,
      };
    } catch (error: unknown) {
      console.error('Erro ao carregar menus:', error instanceof Error ? error.message : 'erro desconhecido');

      return {
        ...user,
        menus: user.menus ?? [],
      };
    }
  }, [loadAllowedMenus]);

  return {
    loadAllowedMenus,
    loadUserWithMenus,
  };
}
