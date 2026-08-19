interface BackgroundRouteSyncIdentity {
  executionOwnerKey: string;
  authenticatedOwnerKey: string | null;
  executionDeviceSessionCode: string | null;
  activeDeviceSessionCode: string | null;
}

/**
 * Impede que uma tarefa atrasada envie uma rota depois de troca de usuário ou
 * aparelho. A execução só pode sair com a mesma identidade que a iniciou.
 */
export function canSynchronizeRouteInBackground({
  executionOwnerKey,
  authenticatedOwnerKey,
  executionDeviceSessionCode,
  activeDeviceSessionCode,
}: BackgroundRouteSyncIdentity): boolean {
  if (
    !executionOwnerKey ||
    !authenticatedOwnerKey ||
    executionOwnerKey !== authenticatedOwnerKey ||
    !activeDeviceSessionCode
  ) {
    return false;
  }

  return (
    !executionDeviceSessionCode ||
    executionDeviceSessionCode === activeDeviceSessionCode
  );
}
