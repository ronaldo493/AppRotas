import type {AxiosInstance} from 'axios';

import type {AppUsageDailyMetric} from '../models/AppUsageDailyMetric';

/** Envia uma fotografia acumulada; repetição por retry continua idempotente. */
export async function enviarMetricaUsoApp(
  client: AxiosInstance,
  metrica: AppUsageDailyMetric,
): Promise<void> {
  await client.post('/metricas-uso-app/atividade', metrica, {
    timeout: 5_000,
    'axios-retry': {retries: 0},
  });
}
