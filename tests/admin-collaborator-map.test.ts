import assert from 'node:assert/strict';
import test from 'node:test';

import {mapearRespostaMapaColaboradores} from '../src/features/admin/useCases/mapAdminCollaboratorMapResponse';

test('converte decimais do Strapi antes de entregar posições ao mapa', () => {
  const resposta = mapearRespostaMapaColaboradores({
    geradoEm: '2026-08-18T12:00:00.000Z',
    validadeMaximaMinutos: 60,
    escopo: {abrangencia: 'todos_setores', setor: null},
    totais: {atual: 1, recente: 0, desatualizada: 0},
    colaboradores: [{
      usuarioId: 7,
      username: 'Ana Silva',
      setor: 'Tecnologia',
      cargo: null,
      latitude: '-22.7218',
      longitude: '-47.6476',
      precisaoMetros: '18.4',
      capturadaEm: '2026-08-18T11:59:00.000Z',
      recebidaEm: '2026-08-18T11:59:01.000Z',
      idadeSegundos: '60',
      estado: 'atual',
      sessaoAtiva: true,
      origem: 'aplicativo',
    }],
  });

  assert.equal(typeof resposta.colaboradores[0].latitude, 'number');
  assert.equal(resposta.colaboradores[0].latitude, -22.7218);
  assert.equal(resposta.colaboradores[0].longitude, -47.6476);
  assert.equal(resposta.colaboradores[0].precisaoMetros, 18.4);
});
