import AsyncStorage from '@react-native-async-storage/async-storage';
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
  origem: 'servidor' | 'cache' | 'indisponivel';
}

const CONFIG_CACHE_DURATION_MS = 60_000;
const CONFIG_STORAGE_KEY =
  '@drogal:route-monitoring-config:v1';
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

interface StoredConfiguration {
  serverKey: string;
  habilitado: boolean;
  atualizadoEm: number;
}

const readStoredConfiguration = async (
  serverKey: string,
): Promise<ResultadoConfiguracaoMonitoramento | null> => {
  try {
    const serialized = await AsyncStorage.getItem(
      CONFIG_STORAGE_KEY,
    );

    if (!serialized) return null;

    const stored = JSON.parse(
      serialized,
    ) as Partial<StoredConfiguration>;

    if (
      stored.serverKey !== serverKey ||
      typeof stored.habilitado !== 'boolean' ||
      typeof stored.atualizadoEm !== 'number' ||
      !Number.isFinite(stored.atualizadoEm)
    ) {
      return null;
    }

    return {
      habilitado: stored.habilitado,
      atualizadoEm: stored.atualizadoEm,
      obtidoDoServidor: false,
      origem: 'cache',
    };
  } catch {
    return null;
  }
};

const persistConfiguration = async (
  serverKey: string,
  result: ResultadoConfiguracaoMonitoramento,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({
        serverKey,
        habilitado: result.habilitado,
        atualizadoEm: result.atualizadoEm,
      } satisfies StoredConfiguration),
    );
  } catch {
    /* O cache em memória continua válido se o armazenamento falhar. */
  }
};

/**
 * Consulta a chave operacional antes de traçar uma rota. Em falha de rede,
 * reutiliza a última decisão confirmada; somente uma instalação sem decisão
 * conhecida adota o modo externo como contingência.
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

  const request = (async (): Promise<ResultadoConfiguracaoMonitoramento> => {
    try {
      const response =
        await client.get<
          StrapiSingleResponse<ConfiguracaoAplicativo>
        >('/configuracao-app', {
          timeout: 4_000,
          'axios-retry': {retries: 0},
        });
      const result: ResultadoConfiguracaoMonitoramento =
        {
          habilitado: readEnabledFlag(
            response.data.data,
          ),
          atualizadoEm: Date.now(),
          obtidoDoServidor: true,
          origem: 'servidor',
        };

      cacheByServer.set(serverKey, result);
      await persistConfiguration(serverKey, result);
      return result;
    } catch {
      const lastKnown =
        cacheByServer.get(serverKey) ??
        (await readStoredConfiguration(serverKey));

      if (lastKnown) {
        const cachedResult = {
          ...lastKnown,
          obtidoDoServidor: false,
          origem: 'cache' as const,
        };

        cacheByServer.set(serverKey, cachedResult);
        return cachedResult;
      }

      return {
        habilitado: false,
        atualizadoEm: Date.now(),
        obtidoDoServidor: false,
        origem: 'indisponivel',
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
