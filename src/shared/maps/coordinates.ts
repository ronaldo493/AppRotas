import type {LatLng, Region} from 'react-native-maps';

export interface CoordinateSource {
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export const DEFAULT_REGION: Region = {
  latitude: -22.7253,
  longitude: -47.6492,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

/** Converte coordenadas textuais ou numéricas e rejeita valores fora do globo. */
export const getCoordinates = (item: CoordinateSource): LatLng | null => {
  const parseCoordinate = (value: unknown): number | null => {
    const normalized = String(value ?? '').trim().replace(',', '.');
    if (!normalized) return null;

    const coordinate = Number(normalized);
    return Number.isFinite(coordinate) ? coordinate : null;
  };

  const latitude = parseCoordinate(item.latitude);
  const longitude = parseCoordinate(item.longitude);
  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {latitude, longitude};
};
