import axios, {type AxiosInstance} from 'axios';
import Constants from 'expo-constants';
import {Platform} from 'react-native';

import {environment} from '../../../config/environment';
import type {
  DeviceSession,
  DeviceSessionStartResponse,
} from '../models/DeviceSession';
import {getOrCreateInstallationId} from './deviceInstallationService';
import type {CapturedLocation} from '../../../location/models/LocationSnapshot';

export const DEVICE_SESSION_HEADER = 'X-App-Session-Id';

interface StrapiDataResponse<T> {
  data: T;
}

/** Cria a sessão de segurança logo depois da autenticação do Strapi. */
export async function startDeviceSession(
  jwt: string,
): Promise<DeviceSessionStartResponse> {
  const instalacaoId = await getOrCreateInstallationId();
  const response = await axios.post<
    StrapiDataResponse<DeviceSessionStartResponse>
  >(
    `${environment.strapiBaseUrl}/sessoes-dispositivo/iniciar`,
    {
      instalacaoId,
      versaoAplicativo: Constants.expoConfig?.version ?? null,
      plataforma: Platform.OS,
    },
    {
      timeout: 8_000,
      headers: {Authorization: `Bearer ${jwt}`},
    },
  );

  const session = response.data.data;

  if (
    !session ||
    typeof session.codigoSessao !== 'string' ||
    session.codigoSessao.length < 16 ||
    session.situacaoSessao !== 'ativa'
  ) {
    throw new Error('O servidor retornou uma sessão de aparelho inválida.');
  }

  return session;
}

/** Mantém a validação explícita no retorno ao aplicativo. */
export async function validateDeviceSession(
  client: AxiosInstance,
): Promise<void> {
  await client.get('/sessoes-dispositivo/validar', {
    timeout: 5_000,
    'axios-retry': {retries: 0},
  });
}

/** Envia somente a coordenada já capturada; dados de usuário vêm do JWT. */
export async function registerDeviceLocation(
  client: AxiosInstance,
  location: CapturedLocation,
): Promise<void> {
  await client.post(
    '/sessoes-dispositivo/localizacao',
    {
      latitude: location.coordinates.latitude,
      longitude: location.coordinates.longitude,
      precisaoMetros: location.accuracyMeters,
      capturadaEm: location.capturedAt,
    },
    {
      timeout: 5_000,
      'axios-retry': {retries: 0},
    },
  );
}

/** Encerra a sessão no servidor sem impedir o logout quando não houver rede. */
export async function closeDeviceSession(
  jwt: string,
  session: DeviceSession,
): Promise<void> {
  await axios.post(
    `${environment.strapiBaseUrl}/sessoes-dispositivo/encerrar`,
    undefined,
    {
      timeout: 4_000,
      headers: {
        Authorization: `Bearer ${jwt}`,
        [DEVICE_SESSION_HEADER]: session.codigoSessao,
      },
    },
  );
}
