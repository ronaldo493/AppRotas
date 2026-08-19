import AsyncStorage from '@react-native-async-storage/async-storage';

import {createApiClientStrapi} from '../../../core/api/createStrapiClient';
import {AUTH_STORAGE_KEYS} from '../../../core/auth/authStorageKeys';
import type {AuthUser} from '../../../core/auth/AuthContext';
import type {DeviceSession} from '../../../core/auth/deviceSession/models/DeviceSession';
import {appLogger} from '../../../shared/logging/appLogger';
import {canSynchronizeRouteInBackground} from '../domain/backgroundRouteSyncPolicy';
import {sincronizarExecucoesRota} from '../useCases/sincronizarExecucoesRota';
import {criarExecucaoRotaApi} from './execucaoRotaApi';
import {
  listarPontosExecucaoRota,
  obterExecucaoRota,
} from './execucaoRotaDatabase';
import {obterExecucaoRotaOwner} from './execucaoRotaOwner';
import type {TipoTelemetriaOperacionalRota} from './execucaoRotaApi';

const BACKGROUND_REQUEST_TIMEOUT_MS = 8_000;

interface StoredBackgroundSession {
  token: string;
  user: AuthUser;
  deviceSession: DeviceSession;
}

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/**
 * Recupera apenas uma sessão completa. Dados parciais nunca são usados para
 * enviar coordenadas, evitando associar uma rota ao usuário ou aparelho errado.
 */
async function loadStoredBackgroundSession(): Promise<StoredBackgroundSession | null> {
  const entries = await AsyncStorage.multiGet([
    AUTH_STORAGE_KEYS.token,
    AUTH_STORAGE_KEYS.user,
    AUTH_STORAGE_KEYS.deviceSession,
  ]);
  const values = new Map(entries);
  const token = values.get(AUTH_STORAGE_KEYS.token)?.trim() ?? '';
  const user = parseJson<AuthUser>(values.get(AUTH_STORAGE_KEYS.user) ?? null);
  const deviceSession = parseJson<DeviceSession>(
    values.get(AUTH_STORAGE_KEYS.deviceSession) ?? null,
  );

  if (
    !token ||
    !user ||
    !deviceSession ||
    deviceSession.situacaoSessao !== 'ativa' ||
    !deviceSession.codigoSessao?.trim()
  ) {
    return null;
  }

  return {token, user, deviceSession};
}

/**
 * Envia os pontos pendentes logo após cada entrega do GPS em segundo plano.
 * Falhas de rede não removem dados: o SQLite permanece como fila durável e a
 * próxima entrega, volta ao aplicativo ou sincronização periódica tenta de novo.
 */
export async function sincronizarRotaEmSegundoPlano(
  codigoSessao: string,
): Promise<void> {
  const [execution, storedSession] = await Promise.all([
    obterExecucaoRota(codigoSessao),
    loadStoredBackgroundSession(),
  ]);

  if (!execution || !storedSession) return;

  const owner = obterExecucaoRotaOwner(storedSession.user);
  const executionDeviceSession =
    execution.sessaoDispositivoCodigo?.trim() ?? '';

  if (!canSynchronizeRouteInBackground({
    executionOwnerKey: execution.ownerKey,
    authenticatedOwnerKey: owner?.key ?? null,
    executionDeviceSessionCode: executionDeviceSession || null,
    activeDeviceSessionCode: storedSession.deviceSession.codigoSessao,
  })) {
    return;
  }

  const client = createApiClientStrapi(
    storedSession.token,
    storedSession.deviceSession.codigoSessao,
    {
      timeoutMs: BACKGROUND_REQUEST_TIMEOUT_MS,
      retries: 0,
    },
  );
  const result = await sincronizarExecucoesRota(
    execution.ownerKey,
    criarExecucaoRotaApi(client),
  );

  const pendentes = await listarPontosExecucaoRota(codigoSessao, {
    somentePendentes: true,
    limite: 100_000,
  });

  try {
    await criarExecucaoRotaApi(client).enviarTelemetria(
      codigoSessao,
      {
        tipo: result.falhas > 0 || pendentes.length > 0
          ? 'sincronizacao_pendente'
          : 'lote_enviado',
        ocorridoEm: new Date().toISOString(),
        pontosPendentes: pendentes.length,
      },
      execution.sessaoDispositivoCodigo,
    );
  } catch {
    /* A telemetria nunca pode impedir a fila principal de permanecer íntegra. */
  }

  if (result.falhas > 0) {
    appLogger.debug(
      `A rota ${codigoSessao} continuará pendente após a tentativa em segundo plano.`,
    );
  }
}

/** Envia um estado pontual sem expor dados pessoais ou coordenadas. */
export async function registrarTelemetriaRota(
  codigoSessao: string,
  tipo: TipoTelemetriaOperacionalRota,
): Promise<void> {
  const [execution, storedSession] = await Promise.all([
    obterExecucaoRota(codigoSessao),
    loadStoredBackgroundSession(),
  ]);
  if (!execution || !storedSession) return;

  const pendentes = await listarPontosExecucaoRota(codigoSessao, {
    somentePendentes: true,
    limite: 100_000,
  });
  const client = createApiClientStrapi(
    storedSession.token,
    storedSession.deviceSession.codigoSessao,
    {timeoutMs: BACKGROUND_REQUEST_TIMEOUT_MS, retries: 0},
  );

  try {
    await criarExecucaoRotaApi(client).enviarTelemetria(
      codigoSessao,
      {tipo, ocorridoEm: new Date().toISOString(), pontosPendentes: pendentes.length},
      execution.sessaoDispositivoCodigo,
    );
  } catch {
    /* Best-effort: a próxima sincronização publicará o estado consolidado. */
  }
}
