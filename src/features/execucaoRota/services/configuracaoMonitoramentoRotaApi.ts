import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';

interface ConfiguracaoAplicativo {
  monitoramentoRotasAtivo?: boolean | null;
  attributes?: {
    monitoramentoRotasAtivo?: boolean | null;
  };
}

export interface ResultadoConfiguracaoMonitoramento {
  habilitado: boolean;
  atualizadoEm: number;
  obtidoDoServidor: boolean;
}

const CONFIG_CACHE_DURATION_MS = 60_000;
const cacheByServer =
  new Map<string, ResultadoConfiguracaoMonitoramento>();
const requestsByServer =
  new Map<
    string,
    Promise<ResultadoConfiguracaoMonitoramento>
  >();

const getServerKey = (
  client: AxiosInstance,
): string =>
  String(client.defaults.baseURL ?? 'strapi');

const readEnabledFlag = (
  configuration: ConfiguracaoAplicativo | null,
): boolean =>
  (
    configuration?.attributes ??
    configuration
  )?.monitoramentoRotasAtivo === true;

/**
 * Consulta a chave operacional antes de traçar uma rota. Em falha de rede ou
 * permissão, adota o modo externo: Maps/Waze continuam disponíveis sem criar
 * execução, ativar GPS em segundo plano ou consumir a Routes API do backend.
 */
export async function obterConfiguracaoMonitoramentoRota(
  client: AxiosInstance,
  options: {force?: boolean} = {},
): Promise<ResultadoConfiguracaoMonitoramento> {
  const serverKey = getServerKey(client);
  const cached = cacheByServer.get(serverKey);
  const now = Date.now();

  if (
    !options.force &&
    cached &&
    now - cached.atualizadoEm <
      CONFIG_CACHE_DURATION_MS
  ) {
    return cached;
  }

  const activeRequest =
    requestsByServer.get(serverKey);

  if (activeRequest) return activeRequest;

  const request = (async () => {
    try {
      const response =
        await client.get<
          StrapiSingleResponse<ConfiguracaoAplicativo>
        >('/configuracao-app');
      const result: ResultadoConfiguracaoMonitoramento =
        {
          habilitado: readEnabledFlag(
            response.data.data,
          ),
          atualizadoEm: Date.now(),
          obtidoDoServidor: true,
        };

      cacheByServer.set(serverKey, result);
      return result;
    } catch {
      return {
        habilitado: false,
        atualizadoEm: Date.now(),
        obtidoDoServidor: false,
      };
    }
  })();

  requestsByServer.set(serverKey, request);

  return request.finally(() => {
    if (requestsByServer.get(serverKey) === request) {
      requestsByServer.delete(serverKey);
    }
  });
}

export function limparCacheConfiguracaoMonitoramentoRota(): void {
  cacheByServer.clear();
}
