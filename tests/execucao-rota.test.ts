import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  CoordenadaRota,
  DestinoExecucaoRota,
  PontoRastreamento,
} from '../src/features/execucaoRota/models/ExecucaoRota';
import {
  calcularDistanciaMetros,
  calcularMetricasExecucaoRota,
  codificarPolyline,
  decodificarPolyline,
} from '../src/features/execucaoRota/useCases/calcularMetricasExecucaoRota';
import {processarProgressoVisitasDestinos} from '../src/features/execucaoRota/useCases/confirmarVisitasDestinos';

const SESSION_ID = 'rota-teste';
const START_DATE = new Date(
  '2026-07-30T12:00:00.000Z',
);

const createPoint = (
  sequence: number,
  latitude: number,
  longitude: number,
  secondsAfterStart: number,
  options: {
    accuracy?: number | null;
    speed?: number | null;
  } = {},
): PontoRastreamento => ({
  id: sequence,
  codigoSessao: SESSION_ID,
  sequencia: sequence,
  latitude,
  longitude,
  precisao: options.accuracy ?? 8,
  velocidade: options.speed ?? null,
  direcao: null,
  registradoEm: new Date(
    START_DATE.getTime() +
      secondsAfterStart * 1_000,
  ).toISOString(),
  sincronizado: false,
});

const createDestination = (
  code: number,
  latitude: number,
  longitude: number,
  order: number,
): DestinoExecucaoRota => ({
  codigo: code,
  nome: `Filial ${code}`,
  cidade: 'Piracicaba',
  ordem: order,
  tipo: 'loja',
  latitude,
  longitude,
});

test('calcula distância geodésica em metros', () => {
  const distance = calcularDistanciaMetros(
    {latitude: 0, longitude: 0},
    {latitude: 0, longitude: 0.001},
  );

  assert.ok(distance > 110);
  assert.ok(distance < 112);
});

test('codifica e decodifica o trajeto com precisão de cinco casas', () => {
  const route: CoordenadaRota[] = [
    {latitude: -22.72528, longitude: -47.64917},
    {latitude: -22.73142, longitude: -47.65581},
    {latitude: -22.74201, longitude: -47.66011},
  ];
  const encoded = codificarPolyline(route);
  const decoded = decodificarPolyline(encoded);

  assert.equal(decoded.length, route.length);

  decoded.forEach((coordinate, index) => {
    assert.equal(
      coordinate.latitude,
      route[index].latitude,
    );
    assert.equal(
      coordinate.longitude,
      route[index].longitude,
    );
  });
});

test('decodifica o exemplo de referência do formato Google Polyline', () => {
  const decoded = decodificarPolyline(
    '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  );

  assert.deepEqual(decoded, [
    {latitude: 38.5, longitude: -120.2},
    {latitude: 40.7, longitude: -120.95},
    {latitude: 43.252, longitude: -126.453},
  ]);
});

test('calcula duração, movimento e destino visitado', () => {
  const plannedRoute = codificarPolyline([
    {latitude: 0, longitude: 0},
    {latitude: 0, longitude: 0.01},
  ]);
  const points = [
    createPoint(1, 0, 0, 0, {speed: 8}),
    createPoint(2, 0, 0.004, 60, {speed: 8}),
    createPoint(3, 0, 0.008, 120, {speed: 8}),
    createPoint(4, 0, 0.01, 180, {speed: 0}),
    createPoint(5, 0, 0.01, 190, {speed: 0}),
    createPoint(6, 0, 0.01, 200, {speed: 0}),
  ];
  const summary = calcularMetricasExecucaoRota({
    pontos: points,
    destinos: [
      createDestination(25, 0, 0.01, 1),
    ],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 220_000,
    ).toISOString(),
    trajetoPlanejado: plannedRoute,
  });

  assert.equal(summary.duracaoTotalSegundos, 220);
  assert.equal(summary.quantidadeDesvios, 0);
  assert.deepEqual(summary.destinosVisitados, [25]);
  assert.deepEqual(
    summary.ordemDestinosVisitados,
    [25],
  );
  assert.equal(summary.rotaConfirmadaPorGps, true);
  assert.equal(
    summary.duracaoAteDestinoFinalSegundos,
    180,
  );
  assert.equal(
    summary.chegadaDestinoFinalEm,
    points[3].registradoEm,
  );
  assert.ok(summary.distanciaPercorridaMetros > 1_100);
  assert.ok(summary.trajetoReal);
});

test('confirma desvio somente após leituras consecutivas', () => {
  const plannedRoute = codificarPolyline([
    {latitude: 0, longitude: 0},
    {latitude: 0, longitude: 0.02},
  ]);
  const points = [
    createPoint(1, 0, 0, 0),
    createPoint(2, 0.002, 0.002, 10),
    createPoint(3, 0.002, 0.003, 20),
    createPoint(4, 0.002, 0.004, 30),
    createPoint(5, 0, 0.005, 40),
    createPoint(6, 0, 0.006, 50),
    createPoint(7, -0.002, 0.007, 60),
    createPoint(8, -0.002, 0.008, 70),
    createPoint(9, -0.002, 0.009, 80),
  ];
  const summary = calcularMetricasExecucaoRota({
    pontos: points,
    destinos: [],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 90_000,
    ).toISOString(),
    trajetoPlanejado: plannedRoute,
  });

  assert.equal(summary.quantidadeDesvios, 2);
});

test('lacuna longa não é classificada como veículo parado', () => {
  const points = [
    createPoint(1, 0, 0, 0, {speed: 0}),
    createPoint(2, 0, 0, 300, {speed: 0}),
  ];
  const summary = calcularMetricasExecucaoRota({
    pontos: points,
    destinos: [],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 300_000,
    ).toISOString(),
    trajetoPlanejado: null,
  });

  assert.equal(summary.tempoParadoSegundos, 0);
  assert.equal(summary.duracaoSemSinalSegundos, 300);
  assert.equal(summary.quantidadeDesvios, null);
  assert.equal(summary.rotaConfirmadaPorGps, false);
});

test('ignora ponto impreciso e salto incompatível com veículo', () => {
  const points = [
    createPoint(1, 0, 0, 0),
    createPoint(2, 0.5, 0.5, 10),
    createPoint(3, 0, 0.001, 20, {
      accuracy: 180,
    }),
  ];
  const summary = calcularMetricasExecucaoRota({
    pontos: points,
    destinos: [],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 20_000,
    ).toISOString(),
    trajetoPlanejado: null,
  });

  assert.equal(summary.quantidadePontos, 2);
  assert.equal(summary.distanciaPercorridaMetros, 0);
});

test('confirma chegada mesmo quando o veículo apenas passa pelo destino', () => {
  const destination = createDestination(
    25,
    0,
    0.01,
    1,
  );
  const summary = calcularMetricasExecucaoRota({
    pontos: [
      createPoint(1, 0, 0.009, 0, {speed: 12}),
      createPoint(2, 0, 0.01, 10, {speed: 12}),
      createPoint(3, 0, 0.012, 20, {speed: 12}),
    ],
    destinos: [destination],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 20_000,
    ).toISOString(),
    trajetoPlanejado: null,
  });

  assert.equal(
    summary.quantidadeDestinosVisitados,
    1,
  );
  assert.equal(
    summary.destinosConfirmadosPorGps,
    true,
  );
  assert.equal(
    summary.detalhesDestinosVisitados[0].tipoEvidencia,
    'proximidade',
  );
});

test('não confirma passagem fora do raio e mantém a rota em andamento', () => {
  const destination = createDestination(25, 0, 0.01, 1);
  const progresso = processarProgressoVisitasDestinos(
    [createPoint(1, 0, 0.0088, 0, {speed: 12})],
    [destination],
  );

  assert.equal(progresso[0].visita, null);
});

test('uma leitura imprecisa não confirma chegada nem substitui evidência válida', () => {
  const destination = createDestination(25, 0, 0.01, 1);
  const imprecisa = processarProgressoVisitasDestinos(
    [
      createPoint(1, 0, 0.01, 0, {accuracy: 180}),
    ],
    [destination],
  );
  const precisa = processarProgressoVisitasDestinos(
    [
      createPoint(2, 0, 0.01, 10, {accuracy: 8}),
    ],
    [destination],
    imprecisa,
  );

  assert.equal(imprecisa[0].visita, null);
  assert.ok(precisa[0].visita);
});

test('preserva a visita parcial sem concluir todos os destinos', () => {
  const firstDestination = createDestination(
    25,
    0,
    0.01,
    1,
  );
  const secondDestination = createDestination(
    35,
    0,
    0.02,
    2,
  );
  const points = [
    createPoint(1, 0, 0.01, 0, {speed: 0}),
    createPoint(2, 0, 0.01, 10, {speed: 0}),
    createPoint(3, 0, 0.01, 20, {speed: 0}),
  ];
  const summary = calcularMetricasExecucaoRota({
    pontos: points,
    destinos: [
      firstDestination,
      secondDestination,
    ],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 30_000,
    ).toISOString(),
    trajetoPlanejado: null,
  });

  assert.deepEqual(summary.destinosVisitados, [25]);
  assert.equal(
    summary.quantidadeDestinosPlanejados,
    2,
  );
  assert.equal(
    summary.quantidadeDestinosVisitados,
    1,
  );
  assert.equal(
    summary.destinosConfirmadosPorGps,
    false,
  );
  assert.equal(summary.rotaConfirmadaPorGps, false);
});

test('sinaliza interrupção mesmo com todos os destinos confirmados', () => {
  const points = [
    createPoint(1, 0, 0.01, 0, {speed: 0}),
    createPoint(2, 0, 0.01, 10, {speed: 0}),
    createPoint(3, 0, 0.01, 20, {speed: 0}),
  ];
  const summary = calcularMetricasExecucaoRota({
    pontos: points,
    destinos: [
      createDestination(25, 0, 0.01, 1),
    ],
    iniciadaEm: START_DATE.toISOString(),
    finalizadaEm: new Date(
      START_DATE.getTime() + 30_000,
    ).toISOString(),
    trajetoPlanejado: null,
    ocorrenciasLocalizacao: [
      {
        id: 1,
        tipo: 'localizacao_desativada',
        detectadaEm: new Date(
          START_DATE.getTime() + 5_000,
        ).toISOString(),
        normalizadaEm: new Date(
          START_DATE.getTime() + 15_000,
        ).toISOString(),
        duracaoSegundos: 10,
      },
    ],
  });

  assert.equal(
    summary.destinosConfirmadosPorGps,
    true,
  );
  assert.equal(summary.rotaConfirmadaPorGps, false);
  assert.equal(
    summary.quantidadeInterrupcoesLocalizacao,
    1,
  );
  assert.equal(
    summary.duracaoLocalizacaoIndisponivelSegundos,
    10,
  );
});

test('mantém confirmação de proximidade entre lotes do GPS', () => {
  const destination = createDestination(
    25,
    0,
    0.01,
    1,
  );
  const points = [
    createPoint(1, 0, 0.01, 0, {speed: 0}),
    createPoint(2, 0, 0.01, 10, {speed: 0}),
    createPoint(3, 0, 0.01, 20, {speed: 0}),
  ];
  let progress =
    processarProgressoVisitasDestinos(
      [points[0]],
      [destination],
    );

  progress = processarProgressoVisitasDestinos(
    [points[1]],
    [destination],
    progress,
  );
  progress = processarProgressoVisitasDestinos(
    [points[2]],
    [destination],
    progress,
  );

  assert.equal(progress[0].pontosConsecutivos, 1);
  assert.equal(
    progress[0].visita?.confirmadoEm,
    points[0].registradoEm,
  );
});
