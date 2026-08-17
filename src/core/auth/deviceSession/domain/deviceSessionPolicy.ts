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

export interface DeviceSessionInvalidationMessage {
  title: string;
  description: string;
}

/** Traduz o motivo persistido no servidor sem confundir expiração com troca. */
export function describeDeviceSessionInvalidation(
  reason: unknown,
): DeviceSessionInvalidationMessage {
  if (
    reason === 'expiracao' ||
    reason === 'expirada' ||
    reason === 'DEVICE_SESSION_EXPIRED'
  ) {
    return {
      title: 'Sessão expirada',
      description: 'Entre novamente para continuar.',
    };
  }

  if (reason === 'administrador') {
    return {
      title: 'Acesso encerrado',
      description: 'Sua sessão foi encerrada por um administrador.',
    };
  }

  if (reason === 'renovacao_mesmo_dispositivo') {
    return {
      title: 'Sessão renovada',
      description: 'Entre novamente para continuar neste aparelho.',
    };
  }

  if (
    reason === 'novo_dispositivo' ||
    reason === 'novo_login' ||
    reason === 'SESSION_REVOKED_BY_NEW_LOGIN'
  ) {
    return {
      title: 'Acesso encerrado',
      description: 'Sua conta foi acessada em outro aparelho.',
    };
  }

  return {
    title: 'Acesso encerrado',
    description: 'A sessão deste aparelho não é mais válida.',
  };
}
