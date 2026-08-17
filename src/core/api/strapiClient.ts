import { useMemo } from 'react';
import axios, { type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import {useAuthContext} from '../auth/AuthContext';
import {environment} from '../config/environment';
import {DEVICE_SESSION_HEADER} from '../auth/deviceSession/services/deviceSessionService';
import {shouldInvalidateLocalSession} from '../auth/deviceSession/domain/deviceSessionPolicy';

interface DeviceSessionErrorDetails {
  code: string | null;
  reason: string | null;
}

const getDeviceSessionErrorDetails = (
  error: unknown,
): DeviceSessionErrorDetails => {
  if (!axios.isAxiosError(error)) return {code: null, reason: null};

  const data = error.response?.data as {
    error?: {details?: {code?: unknown; reason?: unknown}};
  } | undefined;
  const code = data?.error?.details?.code;
  const reason = data?.error?.details?.reason;

  return {
    code: typeof code === 'string' ? code : null,
    reason: typeof reason === 'string' ? reason : null,
  };
};

export const createApiClientStrapi = (
  token?: string | null,
  deviceSessionCode?: string | null,
  onSessionInvalidated?: (reason?: string | null) => Promise<void>,
): AxiosInstance => {
  const conexao = axios.create({
    baseURL: environment.strapiBaseUrl,
    timeout: 15000,
    headers: {
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
      ...(deviceSessionCode
        ? {[DEVICE_SESSION_HEADER]: deviceSessionCode}
        : {}),
    },
  });

  axiosRetry(conexao, {retries: 4,});

  if (onSessionInvalidated) {
    conexao.interceptors.response.use(
      response => response,
      error => {
        const details = getDeviceSessionErrorDetails(error);

        if (shouldInvalidateLocalSession(details.code)) {
          void onSessionInvalidated(details.reason ?? details.code);
        }

        return Promise.reject(error);
      },
    );
  }

  return conexao;
};

const useStrapiClient = (): AxiosInstance => {
  const {
    token,
    deviceSession,
    handleRemoteSessionInvalidation,
  } = useAuthContext();

  const conexao = useMemo(
    () => createApiClientStrapi(
      token,
      deviceSession?.codigoSessao,
      handleRemoteSessionInvalidation,
    ),
    [deviceSession?.codigoSessao, handleRemoteSessionInvalidation, token],
  );

  return conexao;
};

export default useStrapiClient;
