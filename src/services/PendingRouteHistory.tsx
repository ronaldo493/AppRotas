import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Filial } from '../type/Filial';

const STORAGE_KEY = '@drogal:pending-route-history';

export interface PendingRouteHistory {
  id: string;
  datahora: string;
  routes: Filial[];
  createdAt?: string;
}

const readPendingHistory = async (): Promise<PendingRouteHistory[]> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);

    return value ? (JSON.parse(value) as PendingRouteHistory[]) : [];
  } catch {
    return [];
  }
};

const savePendingHistory = async (items: PendingRouteHistory[],): Promise<void> => {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items),
  );
};

export const addPendingHistory = async ( routes: Filial[], datahora: string): Promise<void> => {
  const items = await readPendingHistory();

  items.push({
    id: `${Date.now()}-${Math.random()}`,
    datahora,
    routes,
  });

  await savePendingHistory(items);
};

export const syncPendingHistory = async (sendHistory: (routes: Filial[], datahora: string, showErrorToast?: boolean) => Promise<boolean>,): Promise<number> => {
  const items = await readPendingHistory();

  if (items.length === 0)  return 0;

  const remaining: PendingRouteHistory[] = [];
  let sentCount = 0;

  for (const item of items) {
    try {
      const originalDate =
        item.datahora ??
        item.createdAt ??
        new Date().toISOString();

      const sent = await sendHistory(item.routes, originalDate, false);

      if (sent) {
        sentCount += 1;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  await savePendingHistory(remaining);

  return sentCount;
};