import {useEffect} from 'react';

import type {CapturedLocation} from '../../../core/location/models/LocationSnapshot';
import {obterLocalizacaoRecente} from '../../../core/location/services/locationSnapshotService';
import {appLogger} from '../../../shared/logging/appLogger';
import {
  ROUTE_PREVIEW_LOCATION_MAX_ACCURACY_METERS,
  ROUTE_PREVIEW_LOCATION_MAX_AGE_MS,
} from '../useCases/validarOrigemPreviaRota';

/**
 * Antecipa a leitura necessária para a prévia quando o usuário começa a
 * preparar uma rota. A abertura do modal compartilha a requisição em curso.
 */
export default function usePrepararOrigemPreviaRota(
  enabled: boolean,
  currentLocation?: CapturedLocation | null,
): void {
  useEffect(() => {
    if (!enabled) return;

    void obterLocalizacaoRecente(
      currentLocation,
      {
        maxAgeMs:
          ROUTE_PREVIEW_LOCATION_MAX_AGE_MS,
        maxAccuracyMeters:
          ROUTE_PREVIEW_LOCATION_MAX_ACCURACY_METERS,
      },
    ).catch((error: unknown) => {
      appLogger.debug(
        '[prévia-rota] Não foi possível antecipar a origem:',
        error,
      );
    });
  }, [
    currentLocation,
    enabled,
  ]);
}
