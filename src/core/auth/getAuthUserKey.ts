import type {AuthUser} from './AuthContext';

/**
 * Produz a identidade estável usada para isolar caches e estados de sessão.
 * Identificadores imutáveis têm prioridade sobre o nome de usuário.
 */
export function getAuthUserKey(
  user: AuthUser | null,
): string | null {
  if (!user) return null;

  if (
    typeof user.documentId === 'string'
    && user.documentId.trim()
  ) {
    return `document:${user.documentId.trim()}`;
  }

  if (
    typeof user.id === 'number'
    && Number.isFinite(user.id)
  ) {
    return `id:${user.id}`;
  }

  const username = user.username?.trim().toLowerCase();

  return username
    ? `username:${username}`
    : null;
}
