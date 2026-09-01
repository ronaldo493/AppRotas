import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarDatasPeriodoAdmin,
  criarIntervaloDatasAdmin,
  criarIntervaloPeriodoAdmin,
  descreverExecucaoRotaAdmin,
  formatarDistanciaAdmin,
  formatarDuracaoAdmin,
  formatarAlertaOperacionalAdmin,
  formatarConfiabilidadeAdmin,
  formatarMotivoFinalizacaoAdmin,
  formatarOrigemFinalizacaoAdmin,
  formatarResultadoViagemAdmin,
  formatarSituacaoAdmin,
  formatarStatusOperacionalAdmin,
  formatarTempoRelativoAdmin,
  formatarVelocidadeAdmin,
} from '../src/features/admin/useCases/formatAdminRouteDashboard';
import {
  limitarCoordenadasAdminRouteMap,
  prepararAdminRouteMap,
} from '../src/features/admin/useCases/prepareAdminRouteMap';
import {
  descreverRotaAtiva,
  formatarIdadeLocalizacao,
  obterIniciaisColaborador,
} from '../src/features/admin/useCases/formatAdminActiveRoutesMap';

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

test('consulta datas explícitas como dias completos e limita períodos inválidos', () => {
  const agora = new Date(2026, 7, 17, 15, 30, 0);
  const intervalo = criarIntervaloDatasAdmin(
    new Date(2026, 7, 10),
    new Date(2026, 7, 12),
    agora,
  );

  const inicio = new Date(intervalo.inicio);
  const fim = new Date(intervalo.fim);
  assert.equal(inicio.getDate(), 10);
  assert.equal(inicio.getHours(), 0);
  assert.equal(fim.getDate(), 12);
  assert.equal(fim.getHours(), 23);

  const hoje = criarDatasPeriodoAdmin('hoje', agora);
  assert.equal(criarIntervaloDatasAdmin(
    hoje.dataInicial,
    hoje.dataFinal,
    agora,
  ).fim, agora.toISOString());

  assert.throws(
    () => criarIntervaloDatasAdmin(
      new Date(2026, 7, 17),
      new Date(2026, 7, 16),
      agora,
    ),
    /data inicial/,
  );
  assert.throws(
    () => criarIntervaloDatasAdmin(
      new Date(2026, 6, 1),
      new Date(2026, 7, 17),
      agora,
    ),
    /período máximo/,
  );
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
  assert.equal(
    formatarStatusOperacionalAdmin('sem_atualizacao'),
    'Sem atualização recente',
  );
  assert.equal(formatarConfiabilidadeAdmin('media'), 'Média');
  assert.equal(
    formatarResultadoViagemAdmin('sem_evidencia_suficiente'),
    'Evidência insuficiente',
  );
  assert.equal(
    formatarResultadoViagemAdmin('percorrida_com_lacunas'),
    'Destino alcançado com lacunas no GPS',
  );
  assert.equal(formatarVelocidadeAdmin(42.36), '42,4 km/h');
  assert.equal(formatarTempoRelativoAdmin(125), 'há 2 min');
  assert.equal(formatarTempoRelativoAdmin(3_900), 'há 1h 5min');
  assert.match(
    formatarAlertaOperacionalAdmin('sincronizacao_atrasada'),
    /atraso superior a 5 minutos/,
  );
  assert.match(
    formatarAlertaOperacionalAdmin('velocidade_incompativel'),
    /incompatível/,
  );
  assert.match(
    formatarAlertaOperacionalAdmin('possivel_chegada_nao_reconhecida'),
    /próximo ao destino/,
  );
  assert.equal(
    formatarOrigemFinalizacaoAdmin('servidor_destino_confirmado'),
    'Servidor após confirmação do destino',
  );
});

test('explica o resultado da viagem em linguagem operacional', () => {
  const execucao = {
    resultadoViagem: 'percorrida_parcial',
    statusOperacional: 'concluida_com_interrupcao',
    quantidadeDestinosPlanejados: 3,
    quantidadeDestinosVisitados: 1,
    quantidadePontos: 42,
    destinos: [],
  } as unknown as Parameters<typeof descreverExecucaoRotaAdmin>[0];

  assert.match(
    descreverExecucaoRotaAdmin(execucao),
    /confirmou somente 1 de 3 destinos/,
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
    quantidadePontos: 20,
    ultimaLocalizacaoEm: '2026-08-03T12:59:00.000Z',
    ultimaSincronizacaoEm: '2026-08-03T13:00:00.000Z',
    atualizadoEmServidor: '2026-08-03T13:00:00.000Z',
  });

  assert.equal(preparado.trajetoReal.length, 3);
  assert.equal(preparado.destinos.length, 1);
  assert.equal(preparado.enquadramento.length, 2);
});

test('descreve a rota ativa sem afirmar que o colaborador está online', () => {
  const agora = new Date('2026-08-17T12:00:00.000Z').getTime();
  assert.equal(
    formatarIdadeLocalizacao('2026-08-17T11:57:30.000Z', agora),
    'há 2 minutos',
  );
  assert.equal(obterIniciaisColaborador('Ana Maria Silva'), 'AS');
  const descricao = descreverRotaAtiva({
    codigoSessao: 'rota-ativa-7',
    usuarioId: 7,
    username: 'Ana Silva',
    setor: 'Tecnologia',
    iniciadaEm: '2026-08-17T11:30:00.000Z',
    latitude: -22.72,
    longitude: -47.64,
    precisaoMetros: 25,
    capturadaEm: '2026-08-17T11:57:30.000Z',
    recebidaEm: '2026-08-17T11:58:00.000Z',
    idadeSegundos: 150,
    estado: 'atrasada',
    quantidadePontos: 18,
    quantidadeDestinosPlanejados: 2,
    quantidadeDestinosVisitados: 1,
  }, agora);
  assert.match(descricao, /Tecnologia/);
  assert.match(descricao, /há 2 minutos/);
  assert.doesNotMatch(descricao, /online/i);
});
