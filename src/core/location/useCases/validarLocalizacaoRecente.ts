import type {CapturedLocation} from '../models/LocationSnapshot';

export interface CriteriosLocalizacaoRecente {
  maxAgeMs: number;
  maxAccuracyMeters: number;
}

/**
 * Valida idade e precisão de um snapshot sem depender do provedor nativo.
 */
export function localizacaoCapturadaEstaRecente(
  location: CapturedLocation | null | undefined,
  criteria: CriteriosLocalizacaoRecente,
  now = Date.now(),
): location is CapturedLocation {
  if (!location) return false;

  const capturedAt = new Date(location.capturedAt).getTime();
  const age = now - capturedAt;
  const accuracy = location.accuracyMeters;

  return (
    Number.isFinite(capturedAt) &&
    age >= 0 &&
    age <= criteria.maxAgeMs &&
    accuracy !== null &&
    Number.isFinite(accuracy) &&
    accuracy >= 0 &&
    accuracy <= criteria.maxAccuracyMeters
  );
}
