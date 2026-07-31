import type {AuthUser} from '../../../core/auth/AuthContext';

export interface ExecucaoRotaOwner {
  key: string;
  usuarioId: number | null;
  usuarioDocumentId: string | null;
  username: string;
  setor: string;
}

/**
 * Produz uma identidade estável para isolar execuções e pontos por usuário.
 * O identificador numérico tem prioridade, seguido do documentId e username.
 */
export function obterExecucaoRotaOwner(
  user: AuthUser | null,
): ExecucaoRotaOwner | null {
  if (!user) return null;

  const username = user.username?.trim() ?? '';
  const documentId = user.documentId?.trim() ?? '';
  const usuarioId =
    typeof user.id === 'number' && Number.isFinite(user.id)
      ? user.id
      : null;

  let key: string | null = null;

  if (usuarioId !== null) {
    key = `id:${usuarioId}`;
  } else if (documentId) {
    key = `document:${documentId}`;
  } else if (username) {
    key = `username:${username.toLowerCase()}`;
  }

  if (!key) return null;

  return {
    key,
    usuarioId,
    usuarioDocumentId: documentId || null,
    username: username || 'Não informado',
    setor: user.setor?.trim() || 'Não informado',
  };
}
