import type {
  LatLng,
  Region,
} from 'react-native-maps';

import type {Filial} from '../models/Filial';
import {getCoordinates} from '../../../shared/maps/coordinates';

export type FilialMapa = Filial & {
  latitude?: string | number | null;
  longitude?: string | number | null;
};

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
      filial.uf,
      filial.bairro,
      filial.endereco,
    ]
      .filter(Boolean)
      .join(' '),
  );

export const parseLojas = (filiais: FilialMapa[]): LojaMapa[] => {
  const identidades = new Set<string>();

  return filiais.flatMap(filial => {
    const coordinate = getCoordinates(filial);

    if (!coordinate) return [];

    const codigo = Number(filial.codigofilial);
    const identidade =
      Number.isInteger(codigo) && codigo > 0
        ? `codigo:${codigo}`
        : `coordenada:${coordinate.latitude}|${coordinate.longitude}`;
    if (identidades.has(identidade)) return [];

    identidades.add(identidade);
    return [
      {
        filial,
        coordinate,
        address: getAddress(filial),
        searchText: getSearchText(filial),
      },
    ];
  });
};
