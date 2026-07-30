import type {LatLng} from 'react-native-maps';

import {getCoordinates} from '../../../shared/maps/coordinates';
import type {
  CategoriaPonto,
  PontoInteresse,
} from '../../pontos/models/Ponto';

export interface PontoProximo {
  ponto: PontoInteresse;
  distanciaKm: number;
}

const RAIO_TERRA_KM = 6371;
const converterParaRadianos = (valor: number): number =>
  (valor * Math.PI) / 180;

/**
 * Calcula distância geodésica em linha reta pelo método de Haversine.
 */
const calcularDistanciaKm = (
  origem: LatLng,
  destino: LatLng,
): number => {
  const diferencaLatitude = converterParaRadianos(
    destino.latitude - origem.latitude,
  );
  const diferencaLongitude = converterParaRadianos(
    destino.longitude - origem.longitude,
  );
  const latitudeOrigem = converterParaRadianos(origem.latitude);
  const latitudeDestino = converterParaRadianos(destino.latitude);
  const haversine =
    Math.sin(diferencaLatitude / 2) ** 2 +
    Math.cos(latitudeOrigem) *
      Math.cos(latitudeDestino) *
      Math.sin(diferencaLongitude / 2) ** 2;

  return (
    2 *
    RAIO_TERRA_KM *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

/**
 * Filtra a categoria, descarta coordenadas inválidas e devolve os locais mais
 * próximos sem depender de serviços externos.
 */
export const encontrarPontosProximos = (
  pontos: readonly PontoInteresse[],
  origem: LatLng,
  categoria: CategoriaPonto,
  quantidade: number,
): PontoProximo[] =>
  pontos
    .filter(ponto => ponto.categoria === categoria)
    .map(ponto => {
      const coordenadas = getCoordinates(ponto);

      return coordenadas
        ? {
            ponto,
            distanciaKm: calcularDistanciaKm(origem, coordenadas),
          }
        : null;
    })
    .filter((resultado): resultado is PontoProximo => resultado !== null)
    .sort(
      (primeiro, segundo) =>
        primeiro.distanciaKm - segundo.distanciaKm,
    )
    .slice(0, Math.max(1, quantidade));
