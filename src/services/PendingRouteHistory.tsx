import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Filial } from '../type/Filial';
import {
  TIPO_HISTORICO,
  type TipoHistorico,
} from '../type/Historico';

const STORAGE_KEY =
  '@drogal:pending-route-history';

export interface PendingRouteHistory {
  id: string;
  datahora: string;
  routes: Filial[];

  /*
   * Opcional para manter compatibilidade com
   * registros antigos já salvos no aparelho.
   */
  cidadeOrigem?: string | null;

  /*
   * Opcional para que históricos enfileirados por versões
   * anteriores do aplicativo continuem sincronizando.
   */
  tipoHistorico?: TipoHistorico;

  createdAt?: string;
}

type SendHistory = (
  routes: Filial[],
  datahora: string | undefined,
  showErrorToast: boolean | undefined,
  cidadeOrigem: string | null,
  tipoHistorico: TipoHistorico,
) => Promise<boolean>;

const readPendingHistory = async (): Promise<PendingRouteHistory[]> => {
  try {
    const value = await AsyncStorage.getItem(
      STORAGE_KEY,
    );

    if (!value) return [];

    return JSON.parse( value) as PendingRouteHistory[];
  } catch (error: unknown) {
    console.error( 'Erro ao ler históricos pendentes:', error,);

    return [];
  }
};

const savePendingHistory = async (items: PendingRouteHistory[]): Promise<void> => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items),
  );
};

export const addPendingHistory = async (
  routes: Filial[],
  datahora: string,
  cidadeOrigem: string | null,
  tipoHistorico: TipoHistorico =
    TIPO_HISTORICO.LOJA,
): Promise<void> => {
  const items = await readPendingHistory();

  const pendingHistory: PendingRouteHistory = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    datahora,
    routes,
    cidadeOrigem,
    tipoHistorico,
  };

  await savePendingHistory([
    ...items,
    pendingHistory,
  ]);
};

export const syncPendingHistory = async (sendHistory: SendHistory): Promise<number> => {
  const items = await readPendingHistory();

  if (items.length === 0) return 0;

  const remaining: PendingRouteHistory[] = [];
  let sentCount = 0;

  for (const item of items) {
    try {
      const originalDate =
        item.datahora ||
        item.createdAt ||
        new Date().toISOString();

      const sent = await sendHistory(
        item.routes,
        originalDate,
        false,
        item.cidadeOrigem ?? null,
        item.tipoHistorico ??
          TIPO_HISTORICO.LOJA,
      );

      if (sent) {
        sentCount += 1;
        continue;
      }

      remaining.push(item);
    } catch (error: unknown) {
      console.error(`Erro ao sincronizar histórico pendente ${item.id}:`, error);

      remaining.push(item);
    }
  }

  await savePendingHistory(remaining);

  return sentCount;
};
