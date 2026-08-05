import type {LatLng} from 'react-native-maps';

import {decodeGooglePolyline} from '../../../shared/maps/polyline';
import type {
  AdminRouteMapData,
  DestinoAdminRouteMap,
} from '../models/AdminRouteMap';

export interface DestinoAdminRouteMapValido extends DestinoAdminRouteMap {
  latitude: number;
  longitude: number;
}

export interface AdminRouteMapPreparado {
  trajetoReal: LatLng[];
  trajetoPlanejado: LatLng[];
  destinos: DestinoAdminRouteMapValido[];
  enquadramento: LatLng[];
}

const MAX_COORDENADAS_RENDERIZADAS = 5_000;

const coordenadaValida = (coordenada: LatLng): boolean =>
  Number.isFinite(coordenada.latitude)
  && Number.isFinite(coordenada.longitude)
  && coordenada.latitude >= -90
  && coordenada.latitude <= 90
  && coordenada.longitude >= -180
  && coordenada.longitude <= 180;

/** Reduz somente a renderização, mantendo o primeiro e o último ponto. */
export const limitarCoordenadasAdminRouteMap = (
  coordenadas: readonly LatLng[],
  limite = MAX_COORDENADAS_RENDERIZADAS,
): LatLng[] => {
  const validas = coordenadas.filter(coordenadaValida);
  if (limite < 2 || validas.length <= limite) return [...validas];

  const resultado: LatLng[] = [];
  const ultimoIndice = validas.length - 1;
  for (let indice = 0; indice < limite; indice += 1) {
    resultado.push(validas[Math.round((indice * ultimoIndice) / (limite - 1))]);
  }
  return resultado;
};

const calcularEnquadramento = (coordenadas: readonly LatLng[]): LatLng[] => {
  const validas = coordenadas.filter(coordenadaValida);
  if (validas.length <= 1) return [...validas];

  let latitudeMinima = 90;
  let latitudeMaxima = -90;
  let longitudeMinima = 180;
  let longitudeMaxima = -180;

  validas.forEach(({latitude, longitude}) => {
    latitudeMinima = Math.min(latitudeMinima, latitude);
    latitudeMaxima = Math.max(latitudeMaxima, latitude);
    longitudeMinima = Math.min(longitudeMinima, longitude);
    longitudeMaxima = Math.max(longitudeMaxima, longitude);
  });

  return [
    {latitude: latitudeMinima, longitude: longitudeMinima},
    {latitude: latitudeMaxima, longitude: longitudeMaxima},
  ];
};

/** Decodifica e prepara os dados uma única vez antes de entregá-los ao mapa. */
export const prepararAdminRouteMap = (
  data: AdminRouteMapData,
): AdminRouteMapPreparado => {
  const trajetoRealCompleto = decodeGooglePolyline(data.trajetoReal);
  const trajetoPlanejadoCompleto = decodeGooglePolyline(data.trajetoPlanejado);
  const destinos = data.destinos.filter(
    (destino): destino is DestinoAdminRouteMapValido =>
      destino.latitude !== null
      && destino.longitude !== null
      && coordenadaValida({
        latitude: destino.latitude,
        longitude: destino.longitude,
      }),
  );
  const origem = data.origem
    ? [{latitude: data.origem.latitude, longitude: data.origem.longitude}]
    : [];
  const marcadores = destinos.map(({latitude, longitude}) => ({
    latitude,
    longitude,
  }));

  return {
    trajetoReal: limitarCoordenadasAdminRouteMap(trajetoRealCompleto),
    trajetoPlanejado: limitarCoordenadasAdminRouteMap(trajetoPlanejadoCompleto),
    destinos,
    enquadramento: calcularEnquadramento([
      ...trajetoRealCompleto,
      ...trajetoPlanejadoCompleto,
      ...origem,
      ...marcadores,
    ]),
  };
};
