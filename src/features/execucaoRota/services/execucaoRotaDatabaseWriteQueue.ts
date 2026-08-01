const SQLITE_BUSY_RETRY_DELAYS_MS = [80, 200, 500] as const;

let writeQueue: Promise<void> = Promise.resolve();

const wait = (milliseconds: number): Promise<void> =>
  new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });

/** Identifica apenas bloqueios transitórios que podem ser repetidos com segurança. */
export function isTransientSqliteLock(error: unknown): boolean {
  const details =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error ?? '');

  return /SQLITE_BUSY|database is locked|database table is locked/i.test(
    details,
  );
}

/**
 * Serializa todas as mutações do banco de rotas e repete bloqueios transitórios.
 * A fila se recupera de rejeições para que uma falha não impeça operações futuras.
 */
export function runRouteDatabaseWrite<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const scheduled = writeQueue.then(async () => {
    for (
      let attempt = 0;
      attempt <= SQLITE_BUSY_RETRY_DELAYS_MS.length;
      attempt += 1
    ) {
      try {
        return await operation();
      } catch (error: unknown) {
        const delay = SQLITE_BUSY_RETRY_DELAYS_MS[attempt];

        if (
          delay === undefined ||
          !isTransientSqliteLock(error)
        ) {
          throw error;
        }

        await wait(delay);
      }
    }

    throw new Error('Não foi possível concluir a gravação no banco de rotas.');
  });

  writeQueue = scheduled.then(
    () => undefined,
    () => undefined,
  );

  return scheduled;
}
