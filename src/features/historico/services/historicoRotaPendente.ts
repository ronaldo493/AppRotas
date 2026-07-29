import AsyncStorage from '@react-native-async-storage/async-storage';

import type {AuthUser} from '../../../core/auth/AuthContext';
import type {Filial} from '../../filiais/models/Filial';
import {
  TIPO_HISTORICO,
  type TipoHistorico,
} from '../models/Historico';

const LEGACY_STORAGE_KEY =
  '@drogal:pending-route-history';
const STORAGE_KEY_PREFIX =
  '@drogal:pending-route-history:v2';

export type HistoricoOfflineUser = Pick<
  AuthUser,
  'id' | 'documentId' | 'username'
>;

interface HistoricoOwner {
  key: string;
  storageKey: string;
  username: string | null;
}

export interface HistoricoRotaPendente {
  id: string;
  datahora?: string;
  routes: Filial[];
  cidadeOrigem?: string | null;
  tipoHistorico?: TipoHistorico;
  createdAt?: string;

  /*
   * Opcionais para que registros da chave legada possam ser lidos antes da
   * migração. Todos os novos registros recebem os dois campos.
   */
  ownerKey?: string;
  ownerUsername?: string | null;
}

type SendHistory = (
  routes: Filial[],
  datahora: string | undefined,
  showErrorToast: boolean | undefined,
  cidadeOrigem: string | null,
  tipoHistorico: TipoHistorico,
) => Promise<boolean>;

const storageOperations =
  new Map<string, Promise<unknown>>();

const getOwner = (
  user: HistoricoOfflineUser,
): HistoricoOwner => {
  const normalizedUsername =
    user.username?.trim() || null;
  let key: string | null = null;

  if (
    typeof user.id === 'number'
    && Number.isFinite(user.id)
  ) {
    key = `id:${user.id}`;
  } else if (user.documentId?.trim()) {
    key = `document:${user.documentId.trim()}`;
  } else if (normalizedUsername) {
    key =
      `username:${normalizedUsername.toLowerCase()}`;
  }

  if (!key) {
    throw new Error(
      'Não foi possível identificar o proprietário do histórico offline.',
    );
  }

  return {
    key,
    username: normalizedUsername,
    storageKey:
      `${STORAGE_KEY_PREFIX}:${encodeURIComponent(key)}`,
  };
};

const isPendingHistory = (
  value: unknown,
): value is HistoricoRotaPendente => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item =
    value as Partial<HistoricoRotaPendente>;

  return (
    typeof item.id === 'string'
    && item.id.length > 0
    && Array.isArray(item.routes)
    && (
      typeof item.datahora === 'string'
      || typeof item.createdAt === 'string'
    )
  );
};

const parseStoredItems = (
  value: string,
  storageKey: string,
): HistoricoRotaPendente[] => {
  const parsed = JSON.parse(value) as unknown;

  if (
    !Array.isArray(parsed)
    || !parsed.every(isPendingHistory)
  ) {
    throw new Error(
      `A fila de histórico offline está inválida: ${storageKey}`,
    );
  }

  return parsed;
};

const readItems = async (
  storageKey: string,
): Promise<HistoricoRotaPendente[]> => {
  const value = await AsyncStorage.getItem(storageKey);

  return value
    ? parseStoredItems(value, storageKey)
    : [];
};

const writeItems = async (
  storageKey: string,
  items: HistoricoRotaPendente[],
): Promise<void> => {
  if (items.length === 0) {
    await AsyncStorage.removeItem(storageKey);
    return;
  }

  await AsyncStorage.setItem(
    storageKey,
    JSON.stringify(items),
  );
};

const mergeItemsById = (
  first: HistoricoRotaPendente[],
  second: HistoricoRotaPendente[],
): HistoricoRotaPendente[] => {
  const itemsById =
    new Map<string, HistoricoRotaPendente>();

  [...first, ...second].forEach(item => {
    itemsById.set(item.id, item);
  });

  return [...itemsById.values()];
};

const migrateLegacyItems = async (
  owner: HistoricoOwner,
): Promise<void> =>
  runExclusive(
    LEGACY_STORAGE_KEY,
    async () => {
      const legacyValue =
        await AsyncStorage.getItem(
          LEGACY_STORAGE_KEY,
        );

      if (!legacyValue) return;

      let legacyItems: HistoricoRotaPendente[];

      try {
        legacyItems = parseStoredItems(
          legacyValue,
          LEGACY_STORAGE_KEY,
        );
      } catch (error: unknown) {
        /*
         * Uma fila legada corrompida é preservada para não apagar dados que
         * possam ser recuperados manualmente, mas não bloqueia a nova fila.
         */
        console.warn(
          'A fila legada de histórico não pôde ser migrada:',
          error instanceof Error
            ? error.message
            : 'erro desconhecido',
        );
        return;
      }

      const currentItems =
        await readItems(owner.storageKey);
      const migratedItems = legacyItems.map(
        item => ({
          ...item,
          ownerKey: owner.key,
          ownerUsername: owner.username,
        }),
      );

      /*
       * Primeiro grava a fila na chave do usuário e somente depois remove a
       * chave antiga. Se o processo for interrompido, o merge por id evita
       * duplicação na próxima tentativa.
       */
      await writeItems(
        owner.storageKey,
        mergeItemsById(
          migratedItems,
          currentItems,
        ),
      );
      await AsyncStorage.removeItem(
        LEGACY_STORAGE_KEY,
      );
    },
  );

async function runExclusive<T>(
  storageKey: string,
  operation: () => Promise<T>,
): Promise<T> {
  const previousOperation =
    storageOperations.get(storageKey)
    ?? Promise.resolve();
  const currentOperation = previousOperation
    .catch(() => undefined)
    .then(operation);

  storageOperations.set(
    storageKey,
    currentOperation,
  );

  try {
    return await currentOperation;
  } finally {
    if (
      storageOperations.get(storageKey)
      === currentOperation
    ) {
      storageOperations.delete(storageKey);
    }
  }
}

/**
 * Adiciona uma rota à fila exclusiva do usuário autenticado. Operações sobre
 * a mesma fila são serializadas para impedir perda por escrita concorrente.
 */
export async function adicionarHistoricoPendente(
  user: HistoricoOfflineUser,
  routes: Filial[],
  datahora: string,
  cidadeOrigem: string | null,
  tipoHistorico: TipoHistorico =
    TIPO_HISTORICO.LOJA,
): Promise<void> {
  const owner = getOwner(user);

  await runExclusive(
    owner.storageKey,
    async () => {
      await migrateLegacyItems(owner);

      const items =
        await readItems(owner.storageKey);
      const historicoPendente:
        HistoricoRotaPendente = {
          id: `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          datahora,
          routes,
          cidadeOrigem,
          tipoHistorico,
          ownerKey: owner.key,
          ownerUsername: owner.username,
        };

      await writeItems(
        owner.storageKey,
        [...items, historicoPendente],
      );
    },
  );
}

/**
 * Envia somente a fila pertencente ao usuário informado. Registros de outro
 * proprietário nunca são enviados com a sessão atual e permanecem guardados.
 */
export async function sincronizarHistoricosPendentes(
  user: HistoricoOfflineUser,
  sendHistory: SendHistory,
): Promise<number> {
  const owner = getOwner(user);

  return runExclusive(
    owner.storageKey,
    async () => {
      await migrateLegacyItems(owner);

      const items =
        await readItems(owner.storageKey);

      if (items.length === 0) return 0;

      const remaining: HistoricoRotaPendente[] = [];
      let sentCount = 0;

      for (const item of items) {
        if (
          item.ownerKey
          && item.ownerKey !== owner.key
        ) {
          remaining.push(item);
          continue;
        }

        try {
          const originalDate =
            item.datahora
            || item.createdAt
            || new Date().toISOString();
          const sent = await sendHistory(
            item.routes,
            originalDate,
            false,
            item.cidadeOrigem ?? null,
            item.tipoHistorico
              ?? TIPO_HISTORICO.LOJA,
          );

          if (sent) {
            sentCount += 1;
            continue;
          }
        } catch (error: unknown) {
          console.error(
            `Erro ao sincronizar histórico pendente ${item.id}:`,
            error instanceof Error
              ? error.message
              : 'erro desconhecido',
          );
        }

        remaining.push({
          ...item,
          ownerKey: owner.key,
          ownerUsername:
            item.ownerUsername ?? owner.username,
        });
      }

      await writeItems(
        owner.storageKey,
        remaining,
      );

      return sentCount;
    },
  );
}
