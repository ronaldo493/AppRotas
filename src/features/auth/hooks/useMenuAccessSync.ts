import {useCallback, useEffect, useRef} from 'react';
import { AppState, type AppStateStatus} from 'react-native';

import { type AuthUser,useAuthContext} from '../../../core/auth/AuthContext';
import type {AuthMenu} from '../../../core/auth/AuthMenu';
import useAuthMenus, { wasMenuAccessLoadedRecently} from './useAuthMenus';

const FOREGROUND_REFRESH_COOLDOWN_MS = 30_000;
const ACTIVE_SESSION_REFRESH_INTERVAL_MS = 5 * 60_000;

const getUserKey = (user: AuthUser | null): string | null => {
  if (!user) return null;
  if (user.documentId) return `document:${user.documentId}`;
  if (typeof user.id === 'number') return `id:${user.id}`;

  return user.username ? `username:${user.username}` : null;
};

const getMenuSignature = (menus: AuthMenu[] | undefined): string =>
  [...(menus ?? [])]
    .sort((first, second) =>
      `${first.rota}:${first.titulo}`.localeCompare(
        `${second.rota}:${second.titulo}`,
      ),
    )
    .map(menu => [
      menu.titulo,
      menu.rota,
      menu.ativo,
      menu.ordem,
      menu.icone ?? '',
    ].join('|'))
    .join('::');

export default function useMenuAccessSync(): void {
  const { user, token, setUser} = useAuthContext();
  const {loadAllowedMenus} = useAuthMenus();

  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const refreshInProgressRef = useRef(false);
  const lastRefreshAttemptAtRef = useRef(0);

  userRef.current = user;
  tokenRef.current = token;

  const userKey = getUserKey(user);

  const refreshMenuAccess = useCallback(async (force = false): Promise<void> => {
    const currentUser = userRef.current;
    const currentToken = tokenRef.current;
    const currentUserKey = getUserKey(currentUser);
    const now = Date.now();

    if (
      !currentUser
      || !currentToken
      || !currentUserKey
      || refreshInProgressRef.current
    ) {
      return;
    }

    if (
      !force
      && (
        now - lastRefreshAttemptAtRef.current
        < FOREGROUND_REFRESH_COOLDOWN_MS
        || wasMenuAccessLoadedRecently(
          currentUser,
          FOREGROUND_REFRESH_COOLDOWN_MS,
        )
      )
    ) {
      return;
    }

    refreshInProgressRef.current = true;
    lastRefreshAttemptAtRef.current = now;

    try {
      const refreshedMenus = await loadAllowedMenus(
        currentToken,
        currentUser,
      );

      const latestUser = userRef.current;

      // Ignora respostas de uma sessão que foi encerrada ou substituída.
      if (
        tokenRef.current !== currentToken
        || getUserKey(latestUser) !== currentUserKey
        || !latestUser
      ) {
        return;
      }

      if (getMenuSignature(latestUser.menus) === getMenuSignature(refreshedMenus)) {
        return;
      }

      await setUser({
        ...latestUser,
        menus: refreshedMenus,
      });
    } catch (error: unknown) {
      // A indisponibilidade do Strapi não remove os acessos já armazenados.
      console.warn(
        'Não foi possível atualizar os acessos do menu:',
        error instanceof Error ? error.message : 'erro desconhecido',
      );
    } finally {
      refreshInProgressRef.current = false;
    }
  }, [loadAllowedMenus, setUser]);

  useEffect(() => {
    if (!userKey || !token) return;

    lastRefreshAttemptAtRef.current = 0;
    void refreshMenuAccess();
  }, [
    refreshMenuAccess,
    token,
    userKey,
  ]);

  useEffect(() => {
    if (!userKey || !token) return;

    const handleAppStateChange = (nextState: AppStateStatus): void => {
      if (nextState === 'active') {
        void refreshMenuAccess();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refreshMenuAccess(true);
      }
    }, ACTIVE_SESSION_REFRESH_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [
    refreshMenuAccess,
    token,
    userKey,
  ]);
}
