import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AxiosInstance} from 'axios';

import type {Filial} from '../../filiais/models/Filial';
import {
  FILIAIS_ROTA_CACHE_VERSION,
  parseFiliaisRotaCache,
  type FiliaisRotaCache,
  type FiliaisRotaCachePayload,
} from '../useCases/validarCacheFiliaisRota';

const STORAGE_PREFIX = '@drogal:rotas:filiais:v1';

export type {FiliaisRotaCache} from '../useCases/validarCacheFiliaisRota';

const memoryCache = new Map<string, FiliaisRotaCache>();

/** Mantém no aparelho somente os campos usados para pesquisar e abrir rotas. */
const prepararFilialParaCache = (filial: Filial): Filial => ({
  codigofilial: filial.codigofilial,
  nomefilial: filial.nomefilial,
  nomecidade: filial.nomecidade,
  uf: filial.uf,
  endereco: filial.endereco,
  numero: filial.numero,
  bairro: filial.bairro,
  telefone: filial.telefone,
  cnpj: filial.cnpj,
  latitude: filial.latitude,
  longitude: filial.longitude,
});

const getCacheKey = (
  client: AxiosInstance,
  userKey: string,
): string => {
  const serverKey = String(client.defaults.baseURL ?? 'strapi');

  return [
    STORAGE_PREFIX,
    encodeURIComponent(serverKey),
    encodeURIComponent(userKey),
  ].join(':');
};

/** Lê somente o cache pertencente ao servidor e usuário autenticado. */
export async function lerFiliaisRotaCache(
  client: AxiosInstance,
  userKey: string,
): Promise<FiliaisRotaCache | null> {
  const key = getCacheKey(client, userKey);
  const inMemory = memoryCache.get(key);

  if (inMemory) return inMemory;

  try {
    const serialized = await AsyncStorage.getItem(key);
    const cached = serialized
      ? parseFiliaisRotaCache(serialized)
      : null;

    if (cached) memoryCache.set(key, cached);

    return cached;
  } catch {
    return null;
  }
}

/** Atualiza a cópia local apenas depois de uma leitura online válida. */
export async function salvarFiliaisRotaCache(
  client: AxiosInstance,
  userKey: string,
  filiais: readonly Filial[],
): Promise<void> {
  if (filiais.length === 0) return;

  const key = getCacheKey(client, userKey);
  const cached: FiliaisRotaCache = {
    atualizadoEm: Date.now(),
    filiais: filiais.map(prepararFilialParaCache),
  };

  memoryCache.set(key, cached);

  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        version: FILIAIS_ROTA_CACHE_VERSION,
        ...cached,
      } satisfies FiliaisRotaCachePayload),
    );
  } catch {
    // O carregamento online continua válido mesmo se o armazenamento falhar.
  }
}
