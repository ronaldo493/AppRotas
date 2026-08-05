import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';
import Toast from 'react-native-toast-message';

import useStrapiClient from '../../../api/strapiClient';
import {
  useAuthContext,
  type AuthUser,
} from '../../AuthContext';
import {getAuthUserKey} from '../../getAuthUserKey';
import {
  validateForcedPasswordChange,
  type ForcedPasswordChangeInput,
} from '../domain/forcedPasswordChangeValidation';
import {getCachedPasswordChangeStatus} from '../domain/forcedPasswordChangeOfflinePolicy';
import {
  changeRequiredPassword,
  fetchPasswordChangeRequirement,
  getForcedPasswordChangeError,
} from '../services/forcedPasswordChangeService';

export type ForcedPasswordChangeStatus =
  | 'allowed'
  | 'checking'
  | 'required'
  | 'error';

interface VerificationState {
  sessionKey: string | null;
  status: ForcedPasswordChangeStatus;
  errorMessage: string | null;
}

interface UseForcedPasswordChangeReturn {
  authenticated: boolean;
  status: ForcedPasswordChangeStatus;
  errorMessage: string | null;
  changingPassword: boolean;
  retry: () => void;
  logout: () => Promise<void>;
  changePassword: (
    input: ForcedPasswordChangeInput,
  ) => Promise<boolean>;
}

/**
 * Controla apenas a politica de primeiro acesso. O AuthContext permanece
 * independente e pode ser reutilizado por outro provedor de autenticacao.
 */
export default function useForcedPasswordChange(): UseForcedPasswordChangeReturn {
  const client = useStrapiClient();
  const {
    user,
    token,
    setUser,
    clearToken,
  } = useAuthContext();
  const userRef = useRef<AuthUser | null>(user);
  const [changingPassword, setChangingPassword] =
    useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [verification, setVerification] =
    useState<VerificationState>({
      sessionKey: null,
      status: 'allowed',
      errorMessage: null,
    });

  userRef.current = user;
  const userKey = getAuthUserKey(user);
  const sessionKey =
    token && userKey
      ? `${userKey}:${token}`
      : null;
  const authenticated = Boolean(sessionKey);

  useEffect(() => {
    let cancelled = false;

    if (!sessionKey) {
      setVerification({
        sessionKey: null,
        status: 'allowed',
        errorMessage: null,
      });
      return;
    }

    const cachedStatus =
      getCachedPasswordChangeStatus(
        userRef.current?.deveAlterarSenha,
      );

    setVerification({
      sessionKey,
      status: cachedStatus ?? 'checking',
      errorMessage: null,
    });

    void (async () => {
      try {
        const required =
          await fetchPasswordChangeRequirement(client);

        if (cancelled) return;

        const currentUser = userRef.current;

        if (
          currentUser
          && currentUser.deveAlterarSenha !== required
        ) {
          await setUser({
            ...currentUser,
            deveAlterarSenha: required,
          });
        }

        if (cancelled) return;

        setVerification({
          sessionKey,
          status: required ? 'required' : 'allowed',
          errorMessage: null,
        });
      } catch (error: unknown) {
        if (cancelled) return;

        const fallbackStatus =
          getCachedPasswordChangeStatus(
            userRef.current?.deveAlterarSenha,
          );

        if (fallbackStatus) {
          setVerification({
            sessionKey,
            status: fallbackStatus,
            errorMessage: null,
          });
          return;
        }

        setVerification({
          sessionKey,
          status: 'error',
          errorMessage:
            getForcedPasswordChangeError(error),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [client, retryKey, sessionKey, setUser]);

  /*
   * Uma redefinição feita pelo gestor pode ocorrer com o colaborador já
   * conectado. Revalidamos ao voltar ao app e, enquanto ele estiver aberto,
   * a cada cinco minutos. Isso ativa o mesmo gate sem acoplar o painel ao login.
   */
  useEffect(() => {
    if (!sessionKey) return;

    let appState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', nextState => {
      const voltouAoApp = nextState === 'active' && appState !== 'active';
      appState = nextState;
      if (voltouAoApp) setRetryKey(current => current + 1);
    });
    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        setRetryKey(current => current + 1);
      }
    }, 5 * 60_000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [sessionKey]);

  const changePassword = useCallback(
    async (
      input: ForcedPasswordChangeInput,
    ): Promise<boolean> => {
      const validationMessage =
        validateForcedPasswordChange(input);

      if (validationMessage) {
        Toast.show({
          type: 'error',
          text1: 'Verifique as senhas',
          text2: validationMessage,
        });
        return false;
      }

      if (!sessionKey || !userRef.current) {
        Toast.show({
          type: 'error',
          text1: 'Sessão não encontrada',
          text2: 'Entre novamente para alterar sua senha.',
        });
        return false;
      }

      setChangingPassword(true);

      try {
        await changeRequiredPassword(client, input);

        const currentUser = userRef.current;

        if (
          currentUser
          && currentUser.deveAlterarSenha !== false
        ) {
          await setUser({
            ...currentUser,
            deveAlterarSenha: false,
          });
        }

        setVerification({
          sessionKey,
          status: 'allowed',
          errorMessage: null,
        });

        Toast.show({
          type: 'success',
          text1: 'Senha alterada',
          text2: 'Seu acesso foi liberado com a nova senha.',
        });
        return true;
      } catch (error: unknown) {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível alterar',
          text2: getForcedPasswordChangeError(error),
        });
        return false;
      } finally {
        setChangingPassword(false);
      }
    },
    [client, sessionKey, setUser],
  );

  const status =
    sessionKey && verification.sessionKey !== sessionKey
      ? getCachedPasswordChangeStatus(
          user?.deveAlterarSenha,
        ) ?? 'checking'
      : verification.status;

  return {
    authenticated,
    status,
    errorMessage: verification.errorMessage,
    changingPassword,
    retry: () => setRetryKey(current => current + 1),
    logout: clearToken,
    changePassword,
  };
}
