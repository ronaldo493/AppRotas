/**
 * Centraliza logs internos do aplicativo.
 *
 * Em builds distribuídas, os fluxos devem informar falhas por interface
 * (toast, tela ou recuperação automática), sem expor detalhes técnicos no
 * console do colaborador. Em desenvolvimento, os mesmos detalhes permanecem
 * disponíveis para diagnóstico.
 */
export const appLogger = {
  log: (...args: unknown[]): void => {
    if (__DEV__) console.log(...args);
  },
  debug: (...args: unknown[]): void => {
    if (__DEV__) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (__DEV__) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (__DEV__) console.error(...args);
  },
};
