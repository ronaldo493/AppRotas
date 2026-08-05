import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarIntervaloPeriodoAdmin,
  formatarDistanciaAdmin,
  formatarDuracaoAdmin,
  formatarMotivoFinalizacaoAdmin,
  formatarSituacaoAdmin,
} from '../src/features/admin/useCases/formatAdminRouteDashboard';
import {
  limitarCoordenadasAdminRouteMap,
  prepararAdminRouteMap,
} from '../src/features/admin/useCases/prepareAdminRouteMap';

test('cria períodos inclusivos usando o início do dia local', () => {
  const agora = new Date(2026, 7, 3, 15, 30, 0);
  const hoje = criarIntervaloPeriodoAdmin('hoje', agora);
  const seteDias = criarIntervaloPeriodoAdmin('7_dias', agora);
  const trintaDias = criarIntervaloPeriodoAdmin('30_dias', agora);

  const inicioHoje = new Date(hoje.inicio);
  assert.equal(inicioHoje.getHours(), 0);
  assert.equal(inicioHoje.getMinutes(), 0);
  assert.equal(inicioHoje.getDate(), 3);
  assert.equal(new Date(seteDias.inicio).getDate(), 28);
  assert.equal(new Date(trintaDias.inicio).getDate(), 5);
  assert.equal(hoje.fim, agora.toISOString());
});

test('formata métricas e situações sem inventar valores ausentes', () => {
  assert.equal(formatarDistanciaAdmin(550), '550 m');
  assert.match(formatarDistanciaAdmin(12_500), /12,5 km/);
  assert.equal(formatarDistanciaAdmin(null), '—');
  assert.equal(formatarDuracaoAdmin(3_900), '1h 5min');
  assert.equal(formatarDuracaoAdmin(null), '—');
  assert.equal(formatarSituacaoAdmin('concluida_parcial'), 'Parcial');
  assert.equal(
    formatarMotivoFinalizacaoAdmin('interrompida_inatividade'),
    'Encerrada por inatividade',
  );
});

test('prepara o mapa sem renderizar uma quantidade ilimitada de coordenadas', () => {
  const coordenadas = Array.from({length: 20}, (_, indice) => ({
    latitude: -22.7 + indice / 10_000,
    longitude: -47.6 + indice / 10_000,
  }));
  const limitadas = limitarCoordenadasAdminRouteMap(coordenadas, 5);

  assert.equal(limitadas.length, 5);
  assert.deepEqual(limitadas[0], coordenadas[0]);
  assert.deepEqual(limitadas.at(-1), coordenadas.at(-1));

  const preparado = prepararAdminRouteMap({
    codigoSessao: 'rota-teste-123',
    username: 'ronaldo',
    setor: 'Tecnologia',
    situacaoExecucao: 'concluida',
    iniciadaEm: '2026-08-03T12:00:00.000Z',
    finalizadaEm: '2026-08-03T13:00:00.000Z',
    origem: {latitude: 38.5, longitude: -120.2, cidade: 'Origem'},
    destinos: [
      {
        codigo: 25,
        nome: 'Filial 25',
        cidade: 'Destino',
        ordem: 1,
        tipo: 'loja',
        latitude: 43.252,
        longitude: -126.453,
        visitado: true,
      },
      {
        codigo: 35,
        nome: 'Sem coordenada',
        cidade: '',
        ordem: 2,
        tipo: 'loja',
        latitude: null,
        longitude: null,
        visitado: false,
      },
    ],
    trajetoReal: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    trajetoPlanejado: null,
    rotaConfirmadaPorGps: true,
    teveInterrupcaoLocalizacao: false,
  });

  assert.equal(preparado.trajetoReal.length, 3);
  assert.equal(preparado.destinos.length, 1);
  assert.equal(preparado.enquadramento.length, 2);
});
