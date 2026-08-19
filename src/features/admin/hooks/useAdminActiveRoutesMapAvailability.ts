import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../core/api/strapiClient';
import {consultarMapaRotasAtivasHabilitado} from '../services/adminActiveRoutesMapConfigApi';

const CONFIG_REFRESH_INTERVAL_MS = 60_000;

/** Mantém a opção oculta até o servidor confirmar explicitamente a flag. */
export default function useAdminActiveRoutesMapAvailability() {
  const client = useStrapiClient();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async (): Promise<void> => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      const value = await consultarMapaRotasAtivasHabilitado(client);
      if (mountedRef.current) setEnabled(value);
    } catch {
      if (mountedRef.current) setEnabled(false);
    } finally {
      runningRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') void refresh();
    };
    const subscription = AppState.addEventListener('change', onAppStateChange);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, CONFIG_REFRESH_INTERVAL_MS);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [refresh]);

  return {enabled, loading, refresh};
}
