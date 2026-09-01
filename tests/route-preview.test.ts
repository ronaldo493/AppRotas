import assert from 'node:assert/strict';
import test from 'node:test';

import {decodeGooglePolyline} from '../src/shared/maps/polyline';
import {
  createRoutePreviewCacheKey,
  createRoutePreviewRequestKey,
  getRoutePreviewDestinations,
  isRoutePreviewCacheValid,
  ROUTE_PREVIEW_CACHE_MAX_AGE_MS,
  RoutePreviewValidationError,
} from '../src/features/rotas/services/routePreviewService';
import {
  origemPreviaRotaEstaAtualizada,
  ROUTE_PREVIEW_LOCATION_MAX_AGE_MS,
} from '../src/features/rotas/useCases/validarOrigemPreviaRota';
import {formatarEstimativaRotaAssistente} from '../src/features/rotas/useCases/formatarEstimativaRotaAssistente';

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

test('reaproveita a prévia enquanto origem e validade permanecem seguras', () => {
  const now = Date.parse('2026-08-03T12:05:00.000Z');
  const origin = {
    latitude: -22.72528,
    longitude: -47.64917,
  };

  assert.equal(
    isRoutePreviewCacheValid(
      {
        origin,
        createdAt: now - 5 * 60 * 1_000,
      },
      {
        latitude: -22.726,
        longitude: -47.64917,
      },
      now,
    ),
    true,
  );
});

test('invalida a prévia após deslocamento relevante ou expiração', () => {
  const now = Date.parse('2026-08-03T12:15:00.000Z');
  const origin = {
    latitude: -22.72528,
    longitude: -47.64917,
  };

  assert.equal(
    isRoutePreviewCacheValid(
      {origin, createdAt: now - 60_000},
      {
        latitude: -22.73128,
        longitude: -47.64917,
      },
      now,
    ),
    false,
  );
  assert.equal(
    isRoutePreviewCacheValid(
      {
        origin,
        createdAt:
          now - ROUTE_PREVIEW_CACHE_MAX_AGE_MS - 1,
      },
      origin,
      now,
    ),
    false,
  );
});

test('a requisição ativa diferencia origens distintas', () => {
  const routes = [{
    codigofilial: 25,
    nomefilial: 'Filial 25',
    nomecidade: 'Piracicaba',
    latitude: -22.725,
    longitude: -47.649,
  }];
  const first = createRoutePreviewRequestKey(
    {latitude: -22.72528, longitude: -47.64917},
    routes,
  );
  const second = createRoutePreviewRequestKey(
    {latitude: -22.73128, longitude: -47.64917},
    routes,
  );

  assert.notEqual(first, second);
});

test('reutiliza somente uma origem recente e precisa na prévia', () => {
  const now = Date.parse('2026-08-03T12:00:30.000Z');
  const location = {
    coordinates: {
      latitude: -22.72528,
      longitude: -47.64917,
    },
    accuracyMeters: 24,
    capturedAt: '2026-08-03T12:00:10.000Z',
  };

  assert.equal(
    origemPreviaRotaEstaAtualizada(location, now),
    true,
  );
  assert.equal(
    origemPreviaRotaEstaAtualizada(
      {
        ...location,
        accuracyMeters: 180,
      },
      now,
    ),
    false,
  );
  assert.equal(
    origemPreviaRotaEstaAtualizada(
      {
        ...location,
        capturedAt: new Date(
          now - ROUTE_PREVIEW_LOCATION_MAX_AGE_MS - 1,
        ).toISOString(),
      },
      now,
    ),
    false,
  );
});

test('fala duração de rota com horas e minutos por extenso', () => {
  const descricao = formatarEstimativaRotaAssistente({
    durationSeconds: (2 * 60 + 28) * 60,
    distanceMeters: 154_000,
  });

  assert.equal(
    descricao.visual,
    'O trajeto estimado tem 154 km e leva cerca de 2 h 28 min.',
  );
  assert.equal(
    descricao.falada,
    'O trajeto estimado tem 154 quilômetros e leva cerca de 2 horas e 28 minutos.',
  );
});

test('respeita singular e não anuncia zero minuto', () => {
  const descricao = formatarEstimativaRotaAssistente({
    durationSeconds: 60 * 60,
    distanceMeters: 1_200,
  });

  assert.equal(
    descricao.falada,
    'O trajeto estimado tem 1,2 quilômetros e leva cerca de 1 hora.',
  );
});
