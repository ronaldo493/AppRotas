import axios, {type AxiosInstance} from 'axios';
import axiosRetry from 'axios-retry';

import {DEVICE_SESSION_HEADER} from '../auth/deviceSession/services/deviceSessionService';
import {environment} from '../config/environment';

export interface CreateStrapiClientOptions {
  timeoutMs?: number;
  retries?: number;
}

/**
 * Cria o cliente HTTP sem depender do ciclo de vida do React. Isso permite que
 * tarefas nativas enviem lotes de rota mesmo com o aplicativo em segundo plano.
 */
export function createApiClientStrapi(
  token?: string | null,
  deviceSessionCode?: string | null,
  options: CreateStrapiClientOptions = {},
): AxiosInstance {
  const client = axios.create({
    baseURL: environment.strapiBaseUrl,
    timeout: options.timeoutMs ?? 15_000,
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(deviceSessionCode
        ? {[DEVICE_SESSION_HEADER]: deviceSessionCode}
        : {}),
    },
  });

  axiosRetry(client, {retries: options.retries ?? 4});

  return client;
}
