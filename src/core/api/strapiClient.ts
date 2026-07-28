import { useMemo } from 'react';
import axios, { type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import {useAuthContext} from '../auth/AuthContext';
import {environment} from '../config/environment';

export const createApiClientStrapi = (token?: string | null,): AxiosInstance => {
  const conexao = axios.create({
    baseURL: environment.strapiBaseUrl,
    timeout: 15000,
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  axiosRetry(conexao, {retries: 4,});

  return conexao;
};

const useStrapiClient = (): AxiosInstance => {
  const { token } = useAuthContext();

  const conexao = useMemo(
    () => createApiClientStrapi(token),
    [token],
  );

  return conexao;
};

export default useStrapiClient;
