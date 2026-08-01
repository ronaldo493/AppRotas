import type {AuthUser} from '../../../core/auth/AuthContext';
import {getAuthUserKey} from '../../../core/auth/getAuthUserKey';

const lastSuccessfulLoadByUser = new Map<string, number>();

/**
 * Produz uma chave estável para identificar o usuário durante a sincronização
 * dos menus, priorizando os identificadores imutáveis retornados pelo Strapi.
 */
export function getMenuAccessUserKey(user: AuthUser | null): string | null {
  return getAuthUserKey(user);
}

/**
 * Registra em memória quando os acessos do usuário foram carregados com
 * sucesso, evitando uma nova consulta imediatamente após o login.
 */
export function markMenuAccessLoaded(user: AuthUser): void {
  const userKey = getMenuAccessUserKey(user);

  if (userKey) {
    lastSuccessfulLoadByUser.set(userKey, Date.now());
  }
}

/**
 * Informa se os menus do usuário foram consultados dentro do intervalo
 * recebido. O cache existe somente durante a execução atual do aplicativo.
 */
export function wasMenuAccessLoadedRecently(
  user: AuthUser,
  maxAgeMs: number,
): boolean {
  const userKey = getMenuAccessUserKey(user);

  const loadedAt = userKey
    ? lastSuccessfulLoadByUser.get(userKey)
    : undefined;

  return typeof loadedAt === 'number'
    && Date.now() - loadedAt < maxAgeMs;
}
