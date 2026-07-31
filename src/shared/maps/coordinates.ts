import type { LatLng, Region } from 'react-native-maps';
import type {Filial} from '../../features/filiais/models/Filial';

export interface CoordinateSource {
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export type FilialMapa = Filial & CoordinateSource;

export interface LojaMapa {
  filial: FilialMapa;
  coordinate: LatLng;
  address: string;
  searchText: string;
}

export const DEFAULT_REGION: Region = {
  latitude: -22.7253,
  longitude: -47.6492,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export const normalizeText = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const parseCoordinate = (value: unknown): number | null => {
  const normalizedValue =
    String(value ?? '')
      .trim()
      .replace(',', '.');

  if (!normalizedValue) return null;

  const coordinate = Number(normalizedValue);

  return Number.isFinite(coordinate) ? coordinate : null;
};

export const getCoordinates = (item: CoordinateSource): LatLng | null => {
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

  return { latitude, longitude };
};

export const getRegion = (coordinate: LatLng): Region => ({
  ...coordinate,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
});

const getAddress = (filial: FilialMapa): string =>
  [
    filial.endereco,
    filial.numero,
    filial.bairro,
    filial.nomecidade,
  ]
    .filter(Boolean)
    .join(', ');

const getSearchText = (filial: FilialMapa): string =>
  normalizeText(
    [
      filial.codigofilial,
      filial.nomefilial,
      filial.nomecidade,
      filial.bairro,
      filial.endereco,
    ]
      .filter(Boolean)
      .join(' '),
  );

export const parseLojas = (filiais: FilialMapa[]): LojaMapa[] =>
  filiais.flatMap(filial => {
    const coordinate = getCoordinates(filial);

    if (!coordinate) return [];

    return [{
      filial,
      coordinate,
      address: getAddress(filial),
      searchText: getSearchText(filial),
    }];
  });
