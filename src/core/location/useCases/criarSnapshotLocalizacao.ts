import type {
  CapturedLocation,
  LocationCoordinates,
  LocationSnapshot,
} from '../models/LocationSnapshot';

export type ResolverCidade = (
  coordinates: LocationCoordinates,
) => Promise<string | null>;

/**
 * Resolve a cidade usando exatamente as coordenadas capturadas. A cidade é
 * complementar: uma falha de geocodificação nunca invalida a leitura do GPS.
 */
export async function criarSnapshotLocalizacao(
  capturedLocation: CapturedLocation,
  resolveCity: ResolverCidade,
): Promise<LocationSnapshot> {
  let city: string | null = null;

  try {
    city = await resolveCity(
      capturedLocation.coordinates,
    );
  } catch {
    city = null;
  }

  return {
    ...capturedLocation,
    city,
  };
}
