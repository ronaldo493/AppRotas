import assert from 'node:assert/strict';
import test from 'node:test';

import {rotaAtivaPossuiLocalizacao} from '../src/features/admin/models/AdminActiveRoutesMap';
import {mapearRespostaMapaRotasAtivas} from '../src/features/admin/useCases/mapAdminActiveRoutesMapResponse';

test('normaliza decimais e dados operacionais das rotas ativas', () => {
  const resposta = mapearRespostaMapaRotasAtivas({
    geradoEm: '2026-08-18T12:00:00.000Z',
    escopo: {abrangencia: 'todos_setores', setor: null},
    totais: {rotasEmAndamento: 1, comLocalizacao: 1},
    rotas: [{
      codigoSessao: 'rota-123',
      usuarioId: 7,
      username: 'Ana Silva',
      setor: 'Tecnologia',
      iniciadaEm: '2026-08-18T11:30:00.000Z',
      latitude: '-22.7218',
      longitude: '-47.6476',
      precisaoMetros: '18.4',
      capturadaEm: '2026-08-18T11:59:00.000Z',
      idadeSegundos: '60',
      estado: 'atual',
      quantidadePontos: '12',
      totalDestinos: 3,
      destinosVisitados: 1,
    }],
  });

  assert.equal(resposta.rotas[0].latitude, -22.7218);
  assert.equal(resposta.rotas[0].longitude, -47.6476);
  assert.equal(resposta.rotas[0].precisaoMetros, 18.4);
  assert.equal(resposta.rotas[0].quantidadePontos, 12);
  assert.equal(resposta.rotas[0].quantidadeDestinosPlanejados, 3);
  assert.equal(resposta.rotas[0].quantidadeDestinosVisitados, 1);
  assert.equal(rotaAtivaPossuiLocalizacao(resposta.rotas[0]), true);
});

test('conta rota aguardando lote sem inventar marcador na origem', () => {
  const resposta = mapearRespostaMapaRotasAtivas({
    escopo: {abrangencia: 'proprio_setor', setor: 'Infraestrutura'},
    rotas: [{
      codigoSessao: 'rota-sem-ponto',
      username: 'João',
      setor: 'Infraestrutura',
      iniciadaEm: '2026-08-18T12:00:00.000Z',
      latitude: -22.72,
      longitude: -47.64,
      estado: 'aguardando_primeiro_lote',
      quantidadePontos: 0,
    }],
  });

  assert.equal(resposta.rotas.length, 1);
  assert.equal(resposta.totais.rotasEmAndamento, 1);
  assert.equal(resposta.totais.aguardandoPrimeiroLote, 1);
  assert.equal(resposta.rotas[0].latitude, null);
  assert.equal(resposta.rotas[0].longitude, null);
  assert.equal(rotaAtivaPossuiLocalizacao(resposta.rotas[0]), false);
});
