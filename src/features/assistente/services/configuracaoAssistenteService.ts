import AsyncStorage from '@react-native-async-storage/async-storage';
import {isAxiosError, type AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';

interface ConfiguracaoApp {
  assistenteVozAtivo?: boolean | null;
  assistenteOrquestradorAtivo?: boolean | null;
  assistenteSugestoesAtivas?: boolean | null;
  attributes?: {
    assistenteVozAtivo?: boolean | null;
    assistenteOrquestradorAtivo?: boolean | null;
  assistenteSugestoesAtivas?: boolean | null;
  };
}

export interface DisponibilidadeAssistente {
  habilitado: boolean;
  orquestradorHabilitado: boolean;
  sugestoesHabilitadas: boolean;
  atualizadoEm: number;
  origem: 'servidor' | 'cache' | 'indisponivel';
}

interface ConfiguracaoPersistida {
  serverKey: string;
  habilitado: boolean;
  orquestradorHabilitado: boolean;
  sugestoesHabilitadas: boolean;
  atualizadoEm: number;
}

const STORAGE_KEY = '@drogal:assistant-feature-config:v1';
const CACHE_DURATION_MS = 60_000;
const cacheByServer = new Map<string, DisponibilidadeAssistente>();
const requestsByServer = new Map<
  string,
  Promise<DisponibilidadeAssistente>
>();

const getServerKey = (client: AxiosInstance): string =>
  String(client.defaults.baseURL ?? 'strapi');

const readFlags = (
  configuration: ConfiguracaoApp | null,
): Pick<DisponibilidadeAssistente, 'habilitado' | 'orquestradorHabilitado' | 'sugestoesHabilitadas'> => {
  const data = configuration?.attributes ?? configuration;
  return {
    habilitado: data?.assistenteVozAtivo === true,
    orquestradorHabilitado: data?.assistenteOrquestradorAtivo === true,
    sugestoesHabilitadas: data?.assistenteSugestoesAtivas === true,
  };
};

const readStored = async (
  serverKey: string,
): Promise<DisponibilidadeAssistente | null> => {
  try {
    const serialized = await AsyncStorage.getItem(STORAGE_KEY);

    if (!serialized) return null;

    const stored = JSON.parse(serialized) as Partial<ConfiguracaoPersistida>;

    if (
      stored.serverKey !== serverKey ||
      typeof stored.habilitado !== 'boolean' ||
      typeof stored.atualizadoEm !== 'number'
    ) {
      return null;
    }

    return {
      habilitado: stored.habilitado,
      orquestradorHabilitado: stored.orquestradorHabilitado === true,
      sugestoesHabilitadas: stored.sugestoesHabilitadas === true,
      atualizadoEm: stored.atualizadoEm,
      origem: 'cache',
    };
  } catch {
    return null;
  }
};

const persist = async (
  serverKey: string,
  result: DisponibilidadeAssistente,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        serverKey,
        habilitado: result.habilitado,
        orquestradorHabilitado: result.orquestradorHabilitado,
        sugestoesHabilitadas: result.sugestoesHabilitadas,
        atualizadoEm: result.atualizadoEm,
      } satisfies ConfiguracaoPersistida),
    );
  } catch {
    // O resultado em memória continua válido se a persistência falhar.
  }
};

/**
 * Consulta a chave remota e usa a última decisão conhecida quando o aparelho
 * está offline. Sem configuração conhecida, mantém a assistente desligada.
 */
export async function obterDisponibilidadeAssistente(
  client: AxiosInstance,
  options: {force?: boolean} = {},
): Promise<DisponibilidadeAssistente> {
  const serverKey = getServerKey(client);
  const cached = cacheByServer.get(serverKey);
  const now = Date.now();

  if (
    !options.force &&
    cached &&
    now - cached.atualizadoEm < CACHE_DURATION_MS
  ) {
    return cached;
  }

  const activeRequest = requestsByServer.get(serverKey);
  if (activeRequest) return activeRequest;

  const request = (async (): Promise<DisponibilidadeAssistente> => {
    try {
      const response = await client.get<StrapiSingleResponse<ConfiguracaoApp>>(
        '/configuracao-app',
        {
          timeout: 4_000,
          'axios-retry': {retries: 0},
        },
      );
      const result: DisponibilidadeAssistente = {
        ...readFlags(response.data.data),
        atualizadoEm: Date.now(),
        origem: 'servidor',
      };

      cacheByServer.set(serverKey, result);
      await persist(serverKey, result);
      return result;
    } catch (error: unknown) {
      const status = isAxiosError(error) ? error.response?.status : undefined;

      if (status !== undefined && status >= 400 && status < 500) {
        const unavailable: DisponibilidadeAssistente = {
          habilitado: false,
          orquestradorHabilitado: false,
          sugestoesHabilitadas: false,
          atualizadoEm: Date.now(),
          origem: 'indisponivel',
        };

        cacheByServer.set(serverKey, unavailable);
        await persist(serverKey, unavailable);
        return unavailable;
      }

      const lastKnown =
        cacheByServer.get(serverKey) ?? (await readStored(serverKey));

      if (lastKnown) {
        const result = {...lastKnown, origem: 'cache' as const};
        cacheByServer.set(serverKey, result);
        return result;
      }

      return {
        habilitado: false,
        orquestradorHabilitado: false,
        sugestoesHabilitadas: false,
        atualizadoEm: Date.now(),
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

export function limparCacheDisponibilidadeAssistente(): void {
  cacheByServer.clear();
}
