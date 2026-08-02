import assert from 'node:assert/strict';
import test from 'node:test';

import {agruparPontosPorLocal} from '../src/features/pontos/useCases/agruparPontosPorLocal';
import {
  FILIAIS_ROTA_CACHE_VERSION,
  parseFiliaisRotaCache,
  podeUsarCacheFiliaisRota,
} from '../src/features/rotas/useCases/validarCacheFiliaisRota';

const criarPonto = (
  uniqueKey: string,
  latitude: number,
  longitude: number,
) => ({
  uniqueKey,
  coordinate: {latitude, longitude},
});

test('agrupa restaurante e posto cadastrados no mesmo local', () => {
  const grupos = agruparPontosPorLocal([
    criarPonto('restaurante', -22.725, -47.649),
    criarPonto('posto', -22.72503, -47.64902),
  ]);

  assert.equal(grupos.length, 1);
  assert.deepEqual(
    grupos[0].pontos.map(ponto => ponto.uniqueKey),
    ['restaurante', 'posto'],
  );
});

test('mantem estabelecimentos distintos em markers separados', () => {
  const grupos = agruparPontosPorLocal([
    criarPonto('primeiro', -22.725, -47.649),
    criarPonto('segundo', -22.7254, -47.649),
  ]);

  assert.equal(grupos.length, 2);
});

test('aceita somente cache de filiais versionado e valido', () => {
  const atualizadoEm = Date.now();
  const cache = parseFiliaisRotaCache(JSON.stringify({
    version: FILIAIS_ROTA_CACHE_VERSION,
    atualizadoEm,
    filiais: [{
      codigofilial: 25,
      nomefilial: 'Filial 25',
      nomecidade: 'Piracicaba',
      latitude: '-22.7',
      longitude: '-47.6',
    }],
  }));

  assert.equal(cache?.atualizadoEm, atualizadoEm);
  assert.equal(cache?.filiais[0].codigofilial, 25);
  assert.equal(
    parseFiliaisRotaCache('{conteudo-invalido'),
    null,
  );
  assert.equal(
    parseFiliaisRotaCache(JSON.stringify({
      version: FILIAIS_ROTA_CACHE_VERSION + 1,
      atualizadoEm,
      filiais: [],
    })),
    null,
  );
});

test('nao usa cache para contornar erro de autorizacao', () => {
  assert.equal(podeUsarCacheFiliaisRota(null), true);
  assert.equal(podeUsarCacheFiliaisRota(500), true);
  assert.equal(podeUsarCacheFiliaisRota(401), false);
  assert.equal(podeUsarCacheFiliaisRota(403), false);
});
