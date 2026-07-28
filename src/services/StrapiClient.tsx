import { useMemo } from 'react';
import axios, { type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import { useAuthContext } from '../context/AuthContext';

const BASE_URL_PRODUCTION = 'http://ec2-18-229-222-186.sa-east-1.compute.amazonaws.com:3021/api';
const BASE_URL_DEVELOPMENT = 'http://10.215.10.30:3001/api'; //DOCKER
// const BASE_URL_PRODUCTION = 'http://suporteappdrogal.ddns.com.br:18083/api'; - ANTIGO
// const BASE_URL_DEVELOPMENT = 'http://192.168.1.73:3001/api';

const BASE_URL = __DEV__
  ? BASE_URL_DEVELOPMENT
  : BASE_URL_PRODUCTION;

export const createApiClientStrapi = (token?: string | null,): AxiosInstance => {
  const conexao = axios.create({
    baseURL: BASE_URL,
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