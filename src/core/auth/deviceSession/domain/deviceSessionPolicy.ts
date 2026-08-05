const SESSION_INVALIDATION_CODES = new Set([
  'SESSION_REVOKED_BY_NEW_LOGIN',
  'DEVICE_SESSION_INVALID',
  'DEVICE_SESSION_EXPIRED',
]);

/**
 * Erros de ausência de cabeçalho não deslogam: uma instalação migrada ainda
 * pode estar registrando sua primeira sessão em paralelo.
 */
export function shouldInvalidateLocalSession(code: unknown): boolean {
  return typeof code === 'string' && SESSION_INVALIDATION_CODES.has(code);
}
