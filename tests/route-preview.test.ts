import assert from 'node:assert/strict';
import test from 'node:test';

import {decodeGooglePolyline} from '../src/shared/maps/polyline';
import {
  createRoutePreviewCacheKey,
  getRoutePreviewDestinations,
  RoutePreviewValidationError,
} from '../src/features/rotas/services/routePreviewService';

test('decodifica a polyline retornada pela Routes API', () => {
  const coordinates = decodeGooglePolyline(
    '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  );

  assert.deepEqual(coordinates, [
    {latitude: 38.5, longitude: -120.2},
    {latitude: 40.7, longitude: -120.95},
    {latitude: 43.252, longitude: -126.453},
  ]);
});

test('preserva a ordem das filiais na prévia', () => {
  const destinations =
    getRoutePreviewDestinations([
      {
        codigofilial: 25,
        nomefilial: 'Filial 25',
        nomecidade: 'Piracicaba',
        latitude: '-22,725',
        longitude: '-47,649',
      },
      {
        codigofilial: 35,
        nomefilial: 'Filial 35',
        nomecidade: 'Campinas',
        latitude: -22.9,
        longitude: -47.06,
      },
    ]);

  assert.deepEqual(destinations, [
    {latitude: -22.725, longitude: -47.649},
    {latitude: -22.9, longitude: -47.06},
  ]);
});

test('impede a consulta quando uma filial não tem coordenadas válidas', () => {
  assert.throws(
    () =>
      getRoutePreviewDestinations([
        {
          codigofilial: 25,
          nomefilial: 'Filial 25',
          nomecidade: 'Piracicaba',
          latitude: '',
          longitude: '',
        },
      ]),
    RoutePreviewValidationError,
  );
});

test('respeita o limite de destinos aceito pelo planejamento', () => {
  const routes = Array.from(
    {length: 26},
    (_, index) => ({
      codigofilial: index + 1,
      nomefilial: `Filial ${index + 1}`,
      nomecidade: 'Piracicaba',
      latitude: -22.725,
      longitude: -47.649,
    }),
  );

  assert.throws(
    () => getRoutePreviewDestinations(routes),
    RoutePreviewValidationError,
  );
});

test('a chave de cache muda quando a ordem dos destinos muda', () => {
  const filial25 = {
    codigofilial: 25,
    nomefilial: 'Filial 25',
    nomecidade: 'Piracicaba',
    latitude: -22.725,
    longitude: -47.649,
  };
  const filial35 = {
    codigofilial: 35,
    nomefilial: 'Filial 35',
    nomecidade: 'Campinas',
    latitude: -22.9,
    longitude: -47.06,
  };

  const original = createRoutePreviewCacheKey([
    filial25,
    filial35,
  ]);
  const reordered = createRoutePreviewCacheKey([
    filial35,
    filial25,
  ]);
  const sameOrder = createRoutePreviewCacheKey([
    {...filial25},
    {...filial35},
  ]);

  assert.notEqual(original, reordered);
  assert.equal(original, sameOrder);
});
