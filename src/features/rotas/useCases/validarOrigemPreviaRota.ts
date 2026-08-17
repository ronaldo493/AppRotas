import type {CapturedLocation} from '../../../core/location/models/LocationSnapshot';
import {localizacaoCapturadaEstaRecente} from '../../../core/location/useCases/validarLocalizacaoRecente';

export const ROUTE_PREVIEW_LOCATION_MAX_AGE_MS = 30_000;
export const ROUTE_PREVIEW_LOCATION_MAX_ACCURACY_METERS = 100;

/**
 * Permite reaproveitar uma leitura somente enquanto ela ainda representa a
 * posição atual do aparelho com precisão suficiente para iniciar uma rota.
 */
export function origemPreviaRotaEstaAtualizada(
  location: CapturedLocation | null | undefined,
  now = Date.now(),
): location is CapturedLocation {
  return localizacaoCapturadaEstaRecente(
    location,
    {
      maxAgeMs: ROUTE_PREVIEW_LOCATION_MAX_AGE_MS,
      maxAccuracyMeters:
        ROUTE_PREVIEW_LOCATION_MAX_ACCURACY_METERS,
    },
    now,
  );
}
