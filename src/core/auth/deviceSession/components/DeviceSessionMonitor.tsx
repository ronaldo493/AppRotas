import React, {useCallback, useEffect, useRef} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../api/strapiClient';
import {appLogger} from '../../../../shared/logging/appLogger';
import {useAuthContext} from '../../AuthContext';
import {
  startDeviceSession,
  validateDeviceSession,
} from '../services/deviceSessionService';

const VALIDATION_INTERVAL_MS = 5 * 60_000;

/**
 * Registra instalações antigas após a atualização e revalida a sessão ao
 * voltar ao app. Falhas de rede nunca bloqueiam a restauração offline.
 */
export default function DeviceSessionMonitor(): React.JSX.Element | null {
  const {token, user, deviceSession, setDeviceSession} = useAuthContext();
  const client = useStrapiClient();
  const runningRef = useRef(false);

  const synchronize = useCallback(async (): Promise<void> => {
    if (!token || !user || runningRef.current) return;

    runningRef.current = true;
    try {
      if (!deviceSession) {
        const created = await startDeviceSession(token);
        await setDeviceSession(created);
        return;
      }

      await validateDeviceSession(client);
    } catch (error: unknown) {
      appLogger.warn(
        'Não foi possível validar a sessão do aparelho; o modo offline foi preservado:',
        error instanceof Error ? error.message : 'erro desconhecido',
      );
    } finally {
      runningRef.current = false;
    }
  }, [client, deviceSession, setDeviceSession, token, user]);

  useEffect(() => {
    void synchronize();
  }, [synchronize]);

  useEffect(() => {
    if (!token || !user) return;

    const onAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') void synchronize();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void synchronize();
    }, VALIDATION_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [synchronize, token, user]);

  return null;
}
