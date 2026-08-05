import {useCallback} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import {type AuthUser} from '../../../core/auth/AuthContext';
import type {MenuItem} from '../../../core/menu/Menu';
import {appLogger} from '../../../shared/logging/appLogger';
import {markMenuAccessLoaded} from '../services/menuAccessCache';
import {buscarMenusPermitidos} from '../services/menuService';

interface UserWithMenus extends AuthUser {
  menus: MenuItem[];
}

/**
 * Integra o fluxo de menus com React: consulta no Strapi os acessos já
 * autorizados e os acrescenta ao usuário autenticado.
 */
export default function useAuthMenus() {
  const client = useStrapiClient();

  const loadAllowedMenus = useCallback(async (
    jwt: string,
    user: AuthUser,
    deviceSessionCode?: string,
  ): Promise<MenuItem[]> => {
    const menus = await buscarMenusPermitidos(client, jwt, deviceSessionCode);

    markMenuAccessLoaded(user);

    return menus;
  }, [client]);

  const loadUserWithMenus = useCallback(async (
    jwt: string,
    user: AuthUser,
    deviceSessionCode?: string,
  ): Promise<UserWithMenus> => {
    try {
      const menus = await loadAllowedMenus(jwt, user, deviceSessionCode);

      return {
        ...user,
        menus,
      };
    } catch (error: unknown) {
      appLogger.error('Erro ao carregar menus:', error instanceof Error ? error.message : 'erro desconhecido');

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
