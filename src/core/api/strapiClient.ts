import { useMemo } from 'react';
import axios, { type AxiosInstance } from 'axios';

import {useAuthContext} from '../auth/AuthContext';
import {shouldInvalidateLocalSession} from '../auth/deviceSession/domain/deviceSessionPolicy';
import {createApiClientStrapi as createBaseStrapiClient} from './createStrapiClient';

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
  const conexao = createBaseStrapiClient(token, deviceSessionCode);

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
