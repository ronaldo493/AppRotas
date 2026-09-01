import Constants from 'expo-constants';
import React, {useCallback, useEffect, useRef} from 'react';
import {AppState, Platform, type AppStateStatus} from 'react-native';

import useStrapiClient from '../../../api/strapiClient';
import {useAuthContext} from '../../../auth/AuthContext';
import {getAuthUserKey} from '../../../auth/getAuthUserKey';
import {registerSessionTerminationPreparation} from '../../../auth/sessionTerminationCoordinator';
import {appLogger} from '../../../../shared/logging/appLogger';
import type {AppUsageDailyMetric} from '../models/AppUsageDailyMetric';
import {enviarMetricaUsoApp} from '../services/appUsageApi';
import {
  listarMetricasUsoAppPendentes,
  salvarMetricaUsoAppPendente,
} from '../services/appUsageStorage';

const HEARTBEAT_INTERVAL_MS = 4 * 60 * 60 * 1_000;
const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1_000;

const obterDataSaoPaulo = (date: Date): string =>
  new Date(date.getTime() - SAO_PAULO_OFFSET_MS)
    .toISOString()
    .slice(0, 10);

const plataformaAtual = (): AppUsageDailyMetric['plataforma'] =>
  Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web'
    ? Platform.OS
    : 'desconhecida';

/**
 * Mede presença efetiva no app em uma linha diária por usuário. O monitor não
 * captura telas, localização ou conteúdo consultado; registra somente uso
 * agregado e tolera operação offline.
 */
export default function AppUsageMonitor(): React.JSX.Element | null {
  const {token, user} = useAuthContext();
  const client = useStrapiClient();
  const inicioPrimeiroPlanoRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const sincronizandoRef = useRef(false);

  const registrarESincronizar = useCallback(
    async (novaAbertura: boolean): Promise<void> => {
      const usuarioChave = getAuthUserKey(user);
      if (!token || !usuarioChave || sincronizandoRef.current) return;

      sincronizandoRef.current = true;
      const agora = new Date();
      const agoraMs = agora.getTime();
      const inicio = inicioPrimeiroPlanoRef.current ?? agoraMs;
      const segundosNoPrimeiroPlano = Math.max(
        0,
        Math.floor((agoraMs - inicio) / 1_000),
      );
      inicioPrimeiroPlanoRef.current = agoraMs;

      try {
        const existentes =
          await listarMetricasUsoAppPendentes(usuarioChave);
        const dataReferencia = obterDataSaoPaulo(agora);
        const anterior = existentes.find(
          item => item.dataReferencia === dataReferencia,
        );
        const metrica: AppUsageDailyMetric = {
          dataReferencia,
          primeiraAtividadeEm:
            anterior?.primeiraAtividadeEm ?? agora.toISOString(),
          ultimaAtividadeEm: agora.toISOString(),
          aberturas: (anterior?.aberturas ?? 0) + (novaAbertura ? 1 : 0),
          tempoPrimeiroPlanoSegundos:
            (anterior?.tempoPrimeiroPlanoSegundos ?? 0) +
            segundosNoPrimeiroPlano,
          versaoAplicativo: Constants.expoConfig?.version ?? null,
          plataforma: plataformaAtual(),
        };
        const pendentes = await salvarMetricaUsoAppPendente(
          usuarioChave,
          metrica,
        );

        for (const item of pendentes) {
          await enviarMetricaUsoApp(client, item);
        }
      } catch (error: unknown) {
        appLogger.debug(
          'Métrica de uso ficará pendente até haver conexão:',
          error instanceof Error ? error.message : 'erro desconhecido',
        );
      } finally {
        sincronizandoRef.current = false;
      }
    },
    [client, token, user],
  );

  useEffect(() => {
    if (!token || !user) return;

    inicioPrimeiroPlanoRef.current = Date.now();
    void registrarESincronizar(true);

    const onAppStateChange = (proximo: AppStateStatus): void => {
      const anterior = appStateRef.current;
      appStateRef.current = proximo;

      if (anterior === 'active' && proximo !== 'active') {
        void registrarESincronizar(false);
        return;
      }

      if (anterior !== 'active' && proximo === 'active') {
        inicioPrimeiroPlanoRef.current = Date.now();
        void registrarESincronizar(true);
      }
    };
    const subscription = AppState.addEventListener(
      'change',
      onAppStateChange,
    );
    const heartbeat = setInterval(() => {
      if (AppState.currentState === 'active') {
        void registrarESincronizar(false);
      }
    }, HEARTBEAT_INTERVAL_MS);
    const unregisterTermination =
      registerSessionTerminationPreparation(async () => {
        await registrarESincronizar(false);
      });

    return () => {
      subscription.remove();
      clearInterval(heartbeat);
      unregisterTermination();
    };
  }, [registrarESincronizar, token, user]);

  return null;
}
