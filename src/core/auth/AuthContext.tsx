import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { AppState, type AppStateStatus} from 'react-native';
import Toast from 'react-native-toast-message';

import {appLogger} from '../../shared/logging/appLogger';
import {prepareSessionTermination} from './sessionTerminationCoordinator';
import type {DeviceSession} from './deviceSession/models/DeviceSession';
import {describeDeviceSessionInvalidation} from './deviceSession/domain/deviceSessionPolicy';
import {closeDeviceSession} from './deviceSession/services/deviceSessionService';
import type {MenuItem} from '../menu/Menu';

const TOKEN_STORAGE_KEY = 'userToken';
const USER_STORAGE_KEY = 'userData';
const DEVICE_SESSION_STORAGE_KEY = 'deviceSession';

interface JwtPayload {
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id?: number;
  documentId?: string;
  username?: string;
  email?: string;
  emailSec?: string | null;
  deveAlterarSenha?: boolean;
  confirmed?: boolean;
  blocked?: boolean;
  setor?: string | null;
  cargo?: string | null;
  menus?: MenuItem[];
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  deviceSession: DeviceSession | null;

  setUser: (newUser: AuthUser | null) => Promise<void>;
  setToken: (newToken: string) => Promise<void>;
  setDeviceSession: (session: DeviceSession | null) => Promise<void>;
  clearToken: () => Promise<void>;
  handleRemoteSessionInvalidation: (reason?: string | null) => Promise<void>;
  setLoading: Dispatch<SetStateAction<boolean>>;

  isLoggedIn: () => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

/*
 * IMPORTANTE — NÃO REMOVER ESTA IMPLEMENTAÇÃO
 *
 * Durante o Fast Refresh do React Native, este arquivo pode ser
 * executado novamente sem que toda a árvore de componentes seja
 * completamente remontada.
 *
 * Se utilizarmos apenas:
 *
 *   createContext<AuthContextValue | undefined>(undefined)
 *
 * uma nova instância do AuthContext poderá ser criada enquanto o
 * AuthProvider ainda utiliza a instância anterior. Nesse cenário,
 * componentes atualizados deixam de encontrar o Provider e ocorre:
 *
 *   "useAuthContext deve ser utilizado dentro do AuthProvider."
 *
 * O contexto é armazenado no globalThis somente em desenvolvimento
 * para preservar sua identidade entre atualizações do Fast Refresh.
 *
 * Em produção, o contexto é criado normalmente e esse comportamento
 * não interfere no funcionamento do aplicativo.
 */
interface AuthContextGlobal {
  __drogalAuthContext?: React.Context<AuthContextValue | undefined>;
}

const globalAuthContext = globalThis as typeof globalThis & AuthContextGlobal;

const AuthContext = globalAuthContext.__drogalAuthContext ?? createContext<AuthContextValue | undefined>(undefined);

if (__DEV__) {
  globalAuthContext.__drogalAuthContext = AuthContext;
}

const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error: unknown) {
    appLogger.error( 'Erro ao decodificar token:', error);

    return null;
  }
};

const isTokenValid = (token: string | null): boolean => {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }

  const decodedToken = decodeToken(token);

  if (!decodedToken || typeof decodedToken.exp !== 'number') {
    return false;
  }

  /*
   * O Strapi envia exp em segundos.
   * Date.now() retorna milissegundos.
   */
  return Date.now() < decodedToken.exp * 1000;
};

export function AuthProvider({children}: AuthProviderProps): React.JSX.Element {
  const [user, setUserState] =useState<AuthUser | null>(null);
  const [token, setTokenState] =  useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceSession, setDeviceSessionState] =
    useState<DeviceSession | null>(null);

  const expirationInProgressRef =  useRef<boolean>(false);
  const remoteInvalidationInProgressRef = useRef(false);

  const saveToken = useCallback(async (newToken: string): Promise<void> => {
      if (!isTokenValid(newToken)) {
        throw new Error(
          'O servidor retornou um token inválido ou expirado.',
        );
      }

      try {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);

        setTokenState(newToken);
      } catch (error: unknown) {
        appLogger.error('Erro ao salvar token:', error);

        throw error;
      }
    },
    [],
  );

  const saveUser = useCallback(async (newUser: AuthUser | null): Promise<void> => {
      try {
        if (!newUser) {
          await AsyncStorage.removeItem(
            USER_STORAGE_KEY,
          );

          setUserState(null);

          return;
        }

        await AsyncStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(newUser),
        );

        setUserState(newUser);
      } catch (error: unknown) {
        appLogger.error('Erro ao salvar dados do usuário:', error);

        throw error;
      }
    },
    [],
  );

  const saveDeviceSession = useCallback(
    async (session: DeviceSession | null): Promise<void> => {
      if (!session) {
        await AsyncStorage.removeItem(DEVICE_SESSION_STORAGE_KEY);
        setDeviceSessionState(null);
        return;
      }

      await AsyncStorage.setItem(
        DEVICE_SESSION_STORAGE_KEY,
        JSON.stringify(session),
      );
      setDeviceSessionState(session);
    },
    [],
  );

  /*
   * Remove token, usuário e dados associados
   * à sessão atual.
   *
   */
  const clearToken = useCallback(
    async (): Promise<void> => {
        try {
        await prepareSessionTermination();

        if (token && deviceSession) {
          try {
            await closeDeviceSession(token, deviceSession);
          } catch (error: unknown) {
            appLogger.warn(
              'Não foi possível encerrar a sessão remota; o logout local continuará:',
              error,
            );
          }
        }

        await AsyncStorage.multiRemove([
            TOKEN_STORAGE_KEY,
            USER_STORAGE_KEY,
            DEVICE_SESSION_STORAGE_KEY,
        ]);
        } catch (error: unknown) {
            appLogger.error('Erro ao remover dados da sessão:', error,
        );
        } finally {
            setTokenState(null);
            setUserState(null);
            setDeviceSessionState(null);
        }
    },[deviceSession, token],
  );

  const handleRemoteSessionInvalidation = useCallback(
    async (reason?: string | null): Promise<void> => {
      if (remoteInvalidationInProgressRef.current) return;

      remoteInvalidationInProgressRef.current = true;
      try {
        await clearToken();
        const message = describeDeviceSessionInvalidation(reason);

        Toast.show({
          type: 'info',
          text1: message.title,
          text2: message.description,
          position: 'bottom',
        });
      } finally {
        remoteInvalidationInProgressRef.current = false;
      }
    },
    [clearToken],
  );

  const handleExpiredSession = useCallback(async (): Promise<void> => {
    if (expirationInProgressRef.current) return;

    expirationInProgressRef.current = true;

    try {
        await clearToken();
        Toast.show({
            type: 'info',
            text1: 'Sessão expirada',
            text2: 'Entre novamente para continuar.',
            position: 'bottom',
        });
    } finally {
        expirationInProgressRef.current =
        false;
    }
  }, [clearToken]);


  const restoreSession =
    useCallback(async (): Promise<void> => {
      setLoading(true);

      try {
        const [storedToken, storedUser, storedDeviceSession] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY ),
          AsyncStorage.getItem(USER_STORAGE_KEY),
          AsyncStorage.getItem(DEVICE_SESSION_STORAGE_KEY),
        ]);

        const hasValidSession =
          Boolean(storedToken) &&
          Boolean(storedUser) &&
          isTokenValid(storedToken);

        if (!hasValidSession) {
          await AsyncStorage.multiRemove([
            TOKEN_STORAGE_KEY,
            USER_STORAGE_KEY,
            DEVICE_SESSION_STORAGE_KEY,
          ]);

          setTokenState(null);
          setUserState(null);
          setDeviceSessionState(null);

          return;
        }

        const parsedUser =  JSON.parse(storedUser as string) as AuthUser;
        let parsedDeviceSession: DeviceSession | null = null;

        if (storedDeviceSession) {
          const candidate = JSON.parse(storedDeviceSession) as Partial<DeviceSession>;
          if (
            typeof candidate.codigoSessao === 'string' &&
            candidate.situacaoSessao === 'ativa' &&
            typeof candidate.iniciadaEm === 'string'
          ) {
            parsedDeviceSession = candidate as DeviceSession;
          }
        }

        setTokenState(storedToken as string);

        setUserState(parsedUser);
        setDeviceSessionState(parsedDeviceSession);
      } catch (error: unknown) {
        appLogger.error('Erro ao restaurar sessão:', error);

        await AsyncStorage.multiRemove([
          TOKEN_STORAGE_KEY,
          USER_STORAGE_KEY,
          DEVICE_SESSION_STORAGE_KEY,
        ]);

        setTokenState(null);
        setUserState(null);
        setDeviceSessionState(null);
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * Restaura a sessão quando o aplicativo inicia.
   */
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  /*
   * Programa o logout para o momento exato
   * definido pelo campo exp do JWT.
   *
   * Como o backend foi configurado para 7 dias,
   * o JWT novo já virá com essa duração.
   */
  useEffect(() => {
    if (!token) return;

    const decodedToken = decodeToken(token);

    if (!decodedToken || typeof decodedToken.exp !== 'number') {
      void handleExpiredSession();

      return;
    }

    const remainingTime = decodedToken.exp * 1000 - Date.now();

    if (remainingTime <= 0) {
      void handleExpiredSession();

      return;
    }

    const timeoutId = setTimeout(() => {
      void handleExpiredSession();
    }, remainingTime);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    handleExpiredSession,
    token,
  ]);

  /*
   * O Android ou iOS pode pausar timers quando
   * o aplicativo está em segundo plano.
   *
   * Por isso, verificamos novamente quando
   * o aplicativo volta a ficar ativo.
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      if (nextAppState !== 'active' || !token) {
        return;
      }

      if (!isTokenValid(token)) {
        void handleExpiredSession();
      }
    };

    const subscription =
      AppState.addEventListener(
        'change',
        handleAppStateChange,
      );

    return () => {
      subscription.remove();
    };
  }, [
    handleExpiredSession,
    token,
  ]);

  const isLoggedIn =
    useCallback((): boolean => {
      return Boolean(
        user &&
          token &&
          isTokenValid(token),
      );
    }, [token, user]);

  const contextValue =
    useMemo<AuthContextValue>(
      () => ({
        user,
        token,
        loading,
        deviceSession,

        setUser: saveUser,
        setToken: saveToken,
        setDeviceSession: saveDeviceSession,
        clearToken,
        handleRemoteSessionInvalidation,

        setLoading,
        isLoggedIn,
      }),
      [
        clearToken,
        deviceSession,
        handleRemoteSessionInvalidation,
        isLoggedIn,
        loading,
        saveToken,
        saveDeviceSession,
        saveUser,
        token,
        user,
      ],
    );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuthContext():
  AuthContextValue {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuthContext deve ser utilizado dentro do AuthProvider.',
    );
  }

  return context;
}
