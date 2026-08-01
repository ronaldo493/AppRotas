export type SessionTerminationPreparation = () => Promise<void>;

export type SessionTerminationResult =
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'not_registered';

const PREPARATION_TIMEOUT_MS = 4_000;

let preparation: SessionTerminationPreparation | null = null;
let activePreparation: Promise<SessionTerminationResult> | null = null;

/** Registra a preparação pertencente à sessão autenticada atualmente. */
export function registerSessionTerminationPreparation(
  handler: SessionTerminationPreparation,
): () => void {
  preparation = handler;

  return () => {
    if (preparation === handler) preparation = null;
  };
}

/**
 * Dá aos módulos locais uma janela curta para persistir e sincronizar dados
 * antes que o JWT seja removido, sem deixar o logout indefinidamente preso.
 */
export function prepareSessionTermination(
  timeoutMs = PREPARATION_TIMEOUT_MS,
): Promise<SessionTerminationResult> {
  if (activePreparation) return activePreparation;
  if (!preparation) return Promise.resolve('not_registered');

  const handler = preparation;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const operation = handler().then<
    SessionTerminationResult,
    SessionTerminationResult
  >(
    () => 'completed',
    () => 'failed',
  );
  const timeout = new Promise<SessionTerminationResult>(resolve => {
    timeoutId = setTimeout(
      () => resolve('timeout'),
      timeoutMs,
    );
  });

  activePreparation = Promise.race([operation, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
    activePreparation = null;
  });

  return activePreparation;
}
