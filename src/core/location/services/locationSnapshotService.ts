import * as Location from 'expo-location';

import {appLogger} from '../../../shared/logging/appLogger';
import type {
  CapturedLocation,
  LocationCoordinates,
  LocationSnapshot,
} from '../models/LocationSnapshot';
import {criarSnapshotLocalizacao} from '../useCases/criarSnapshotLocalizacao';

const REVERSE_GEOCODING_TIMEOUT_MS = 5_000;

/** Identifica a cidade das coordenadas sem bloquear o fluxo em caso de falha. */
export async function resolverCidadePorCoordenadas(
  coordinates: LocationCoordinates,
): Promise<string | null> {
  let timeoutHandle:
    | ReturnType<typeof setTimeout>
    | undefined;

  try {
    const timeout = new Promise<never>(
      (_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(
            new Error(
              'Tempo limite ao identificar a cidade.',
            ),
          ),
          REVERSE_GEOCODING_TIMEOUT_MS,
        );
      },
    );
    const addresses = await Promise.race([
      Location.reverseGeocodeAsync(coordinates),
      timeout,
    ]);
    const address = addresses[0];

    return (
      address?.city?.trim() ||
      address?.subregion?.trim() ||
      null
    );
  } catch (error: unknown) {
    appLogger.error(
      'Erro ao identificar cidade pelas coordenadas:',
      error,
    );

    return null;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Constrói o snapshot a partir de uma leitura já realizada, evitando uma
 * segunda consulta ao GPS e garantindo a mesma origem para cidade e posição.
 */
export async function criarSnapshotDaLocalizacao(
  location: Location.LocationObject,
): Promise<LocationSnapshot> {
  return criarSnapshotLocalizacao(
    converterLocalizacaoEmLeitura(location),
    resolverCidadePorCoordenadas,
  );
}

/** Converte o retorno nativo em um contrato independente do Expo. */
export function converterLocalizacaoEmLeitura(
  location: Location.LocationObject,
): CapturedLocation {
  return {
    coordinates: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    },
    accuracyMeters:
      Number.isFinite(location.coords.accuracy)
        ? location.coords.accuracy
        : null,
    capturedAt: new Date(
      location.timestamp,
    ).toISOString(),
  };
}

/**
 * Lê o GPS e solicita a permissão de primeiro plano somente quando o sistema
 * ainda permite perguntar. Uma negativa retorna `null` sem quebrar o fluxo.
 */
export async function capturarLocalizacaoAtual(): Promise<CapturedLocation | null> {
  let permission =
    await Location.getForegroundPermissionsAsync();

  if (
    permission.status !==
      Location.PermissionStatus.GRANTED &&
    permission.canAskAgain
  ) {
    permission =
      await Location.requestForegroundPermissionsAsync();
  }

  if (
    permission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    return null;
  }

  const location =
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
    });

  return converterLocalizacaoEmLeitura(location);
}

/** Captura GPS e cidade como uma unidade para persistência e auditoria. */
export async function capturarSnapshotLocalizacaoAtual(): Promise<LocationSnapshot | null> {
  const capturedLocation =
    await capturarLocalizacaoAtual();

  if (!capturedLocation) return null;

  return criarSnapshotLocalizacao(
    capturedLocation,
    resolverCidadePorCoordenadas,
  );
}
