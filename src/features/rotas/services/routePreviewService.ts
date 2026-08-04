import type {AxiosInstance} from 'axios';
import type {LatLng} from 'react-native-maps';

import type {Filial} from '../../filiais/models/Filial';
import {getCoordinates} from '../../../shared/maps/coordinates';
import {decodeGooglePolyline} from '../../../shared/maps/polyline';
import type {
  RoutePreview,
  RoutePreviewApiResponse,
} from '../models/RoutePreview';

export class RoutePreviewValidationError extends Error {}

const MAX_ROUTE_PREVIEW_DESTINATIONS = 25;
const EARTH_RADIUS_METERS = 6_371_000;

export const ROUTE_PREVIEW_CACHE_MAX_AGE_MS =
  10 * 60 * 1_000;
export const ROUTE_PREVIEW_CACHE_MAX_DISTANCE_METERS =
  500;

export interface RoutePreviewCacheMetadata {
  origin: LatLng;
  createdAt: number;
}

const toRadians = (degrees: number): number =>
  degrees * (Math.PI / 180);

/** Calcula a distância entre duas origens para validar o reaproveitamento. */
function getDistanceMeters(
  first: LatLng,
  second: LatLng,
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

/**
 * Identifica a composição exata da rota sem considerar pequenas oscilações
 * do GPS. Alterar, remover ou reordenar qualquer destino invalida a chave.
 */
export function createRoutePreviewCacheKey(
  routes: readonly Filial[],
): string {
  return routes
    .map((route, index) => {
      const coordinate = getCoordinates(route);

      return [
        index,
        route.codigofilial,
        coordinate?.latitude ?? 'invalid',
        coordinate?.longitude ?? 'invalid',
      ].join(':');
    })
    .join('|');
}

/**
 * Diferencia requisições simultâneas pela rota e pela origem efetivamente
 * consultada, sem transformar pequenas variações do GPS em cache permanente.
 */
export function createRoutePreviewRequestKey(
  origin: LatLng,
  routes: readonly Filial[],
): string {
  return [
    origin.latitude.toFixed(3),
    origin.longitude.toFixed(3),
    createRoutePreviewCacheKey(routes),
  ].join('|');
}

/**
 * Reutiliza a estimativa somente por um período curto e se o usuário ainda
 * estiver próximo da origem usada no cálculo anterior.
 */
export function isRoutePreviewCacheValid(
  cached: RoutePreviewCacheMetadata,
  currentOrigin: LatLng,
  now = Date.now(),
): boolean {
  const age = now - cached.createdAt;

  if (
    age < 0 ||
    age > ROUTE_PREVIEW_CACHE_MAX_AGE_MS
  ) {
    return false;
  }

  return (
    getDistanceMeters(
      cached.origin,
      currentOrigin,
    ) <= ROUTE_PREVIEW_CACHE_MAX_DISTANCE_METERS
  );
}

/**
 * Converte as filiais selecionadas em coordenadas e preserva a ordem definida
 * pelo usuário. A requisição não é enviada se algum destino estiver inválido.
 */
export function getRoutePreviewDestinations(
  routes: readonly Filial[],
): LatLng[] {
  if (routes.length === 0) {
    throw new RoutePreviewValidationError(
      'Adicione ao menos um destino para visualizar a rota.',
    );
  }

  if (
    routes.length >
    MAX_ROUTE_PREVIEW_DESTINATIONS
  ) {
    throw new RoutePreviewValidationError(
      `A rota pode ter no máximo ${MAX_ROUTE_PREVIEW_DESTINATIONS} destinos.`,
    );
  }

  const destinations = routes.map(getCoordinates);

  if (
    destinations.some(
      destination => destination === null,
    )
  ) {
    throw new RoutePreviewValidationError(
      'Uma ou mais filiais possuem coordenadas inválidas.',
    );
  }

  return destinations as LatLng[];
}

/**
 * Consulta somente o planejamento da rota. Este endpoint não cria execução,
 * não inicia o GPS em segundo plano e não registra histórico.
 */
export async function fetchRoutePreview(
  client: AxiosInstance,
  origin: LatLng,
  routes: readonly Filial[],
): Promise<RoutePreview> {
  const destinations =
    getRoutePreviewDestinations(routes);
  const response =
    await client.post<RoutePreviewApiResponse>(
      '/estimativa-rota/calcular',
      {
        origin,
        destinations,
      },
      {
        timeout: 10_000,
        'axios-retry': {retries: 1},
      },
    );
  const data = response.data;
  const coordinates =
    decodeGooglePolyline(data.encodedPolyline);

  if (
    !data.encodedPolyline ||
    coordinates.length < 2
  ) {
    throw new RoutePreviewValidationError(
      'O servidor não retornou o desenho da rota.',
    );
  }

  const durationSeconds =
    data.durationSeconds ??
    data.durationMinutes * 60;
  const distanceMeters =
    data.distanceMeters ??
    Math.round(data.distanceKm * 1000);

  return {
    ...data,
    durationSeconds,
    distanceMeters,
    encodedPolyline: data.encodedPolyline,
    coordinates,
  };
}
