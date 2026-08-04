import assert from 'node:assert/strict';
import test from 'node:test';

import {criarSnapshotLocalizacao} from '../src/core/location/useCases/criarSnapshotLocalizacao';

test('resolve a cidade usando as mesmas coordenadas do snapshot', async () => {
  const capturedLocation = {
    coordinates: {
      latitude: -22.72528,
      longitude: -47.64917,
    },
    accuracyMeters: 8,
    capturedAt: '2026-08-03T12:00:00.000Z',
  };
  let resolvedCoordinates:
    | typeof capturedLocation.coordinates
    | null = null;

  const snapshot = await criarSnapshotLocalizacao(
    capturedLocation,
    async coordinates => {
      resolvedCoordinates = coordinates;
      return 'Piracicaba';
    },
  );

  assert.deepEqual(
    resolvedCoordinates,
    capturedLocation.coordinates,
  );
  assert.deepEqual(
    snapshot.coordinates,
    capturedLocation.coordinates,
  );
  assert.equal(snapshot.city, 'Piracicaba');
});

test('mantém o GPS quando a cidade não pode ser identificada', async () => {
  const capturedLocation = {
    coordinates: {
      latitude: -23.352728,
      longitude: -47.85151,
    },
    accuracyMeters: 12,
    capturedAt: '2026-08-03T13:00:00.000Z',
  };

  const snapshot = await criarSnapshotLocalizacao(
    capturedLocation,
    async () => {
      throw new Error('Geocodificação indisponível');
    },
  );

  assert.equal(snapshot.city, null);
  assert.deepEqual(
    snapshot.coordinates,
    capturedLocation.coordinates,
  );
});
