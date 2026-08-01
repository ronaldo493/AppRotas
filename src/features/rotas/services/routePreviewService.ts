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
