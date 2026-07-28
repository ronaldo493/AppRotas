import axios, {type AxiosInstance} from 'axios';

import type {NewAuditLog} from '../models/AuditLog';

export const createAuditLog = async (
  client: AxiosInstance,
  auditLog: NewAuditLog,
): Promise<boolean> => {
  try {
    await client.post('/audit-logs', {
      data: auditLog,
    });

    return true;
  } catch (error: unknown) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;

    if (__DEV__) {
      console.warn(
        `[AuditLog] Não foi possível registrar ${auditLog.acao}.`,
        status ? `HTTP ${status}` : 'Erro de conexão.',
      );
    }

    return false;
  }
};
