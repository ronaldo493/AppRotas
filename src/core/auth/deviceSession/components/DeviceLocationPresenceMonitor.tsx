import React, {useCallback, useEffect, useRef} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../api/strapiClient';
import {obterLocalizacaoRecente} from '../../../location/services/locationSnapshotService';
import {appLogger} from '../../../../shared/logging/appLogger';
import {useAuthContext} from '../../AuthContext';
import {registerDeviceLocation} from '../services/deviceSessionService';

const PRESENCE_INTERVAL_MS = 60_000;
const MAX_LOCATION_AGE_MS = 60_000;
const MAX_LOCATION_ACCURACY_METERS = 500;

/**
 * Atualiza a última posição conhecida apenas enquanto o aplicativo está em
 * primeiro plano. Uma rota ativa continua usando seu rastreamento próprio.
 */
export default function DeviceLocationPresenceMonitor(): React.JSX.Element | null {
  const {token, user, deviceSession} = useAuthContext();
  const client = useStrapiClient();
  const runningRef = useRef(false);
  const lastSentCaptureRef = useRef<string | null>(null);

  const synchronize = useCallback(async (): Promise<void> => {
    if (
      !token || !user || !deviceSession ||
      AppState.currentState !== 'active' || runningRef.current
    ) {
      return;
    }

    runningRef.current = true;
    try {
      const location = await obterLocalizacaoRecente(undefined, {
        maxAgeMs: MAX_LOCATION_AGE_MS,
        maxAccuracyMeters: MAX_LOCATION_ACCURACY_METERS,
      });
      if (
        !location || location.accuracyMeters === null ||
        location.accuracyMeters > MAX_LOCATION_ACCURACY_METERS ||
        location.capturedAt === lastSentCaptureRef.current
      ) {
        return;
      }

      await registerDeviceLocation(client, location);
      lastSentCaptureRef.current = location.capturedAt;
    } catch (error: unknown) {
      appLogger.debug(
        'A presença do aparelho será atualizada na próxima oportunidade:',
        error instanceof Error ? error.message : 'erro desconhecido',
      );
    } finally {
      runningRef.current = false;
    }
  }, [client, deviceSession, token, user]);

  useEffect(() => {
    if (!token || !user || !deviceSession) {
      lastSentCaptureRef.current = null;
      return;
    }
    void synchronize();
  }, [deviceSession, synchronize, token, user]);

  useEffect(() => {
    if (!token || !user || !deviceSession) return;
    const onAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') void synchronize();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    const interval = setInterval(() => void synchronize(), PRESENCE_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [deviceSession, synchronize, token, user]);

  return null;
}
