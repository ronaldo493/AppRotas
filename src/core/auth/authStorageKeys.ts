/**
 * Mantém as chaves da sessão em um único lugar para que fluxos React e tarefas
 * nativas em segundo plano leiam exatamente os mesmos dados autenticados.
 */
export const AUTH_STORAGE_KEYS = {
  token: 'userToken',
  user: 'userData',
  deviceSession: 'deviceSession',
} as const;
