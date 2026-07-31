import type {CoordenadaRota} from '../models/ExecucaoRota';

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

/**
 * Calcula a distância geodésica entre duas coordenadas usando Haversine.
 */
export function calcularDistanciaMetros(
  first: CoordenadaRota,
  second: CoordenadaRota,
): number {
  const latitudeDelta = toRadians(
    second.latitude - first.latitude,
  );
  const longitudeDelta = toRadians(
    second.longitude - first.longitude,
  );
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    )
  );
}
