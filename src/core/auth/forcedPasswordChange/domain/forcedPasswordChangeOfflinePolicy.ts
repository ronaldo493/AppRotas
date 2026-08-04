export type CachedPasswordChangeStatus =
  | 'allowed'
  | 'required';

/**
 * Converte somente uma decisão booleana persistida em estado de acesso. Um
 * valor ausente ou inválido nunca libera silenciosamente o primeiro acesso.
 */
export function getCachedPasswordChangeStatus(
  mustChangePassword: unknown,
): CachedPasswordChangeStatus | null {
  if (mustChangePassword === true) {
    return 'required';
  }

  if (mustChangePassword === false) {
    return 'allowed';
  }

  return null;
}
