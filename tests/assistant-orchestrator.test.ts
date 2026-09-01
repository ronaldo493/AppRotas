import assert from 'node:assert/strict';
import test from 'node:test';

import {deveConsultarOrquestrador} from '../src/features/assistente/useCases/deveConsultarOrquestrador';
import {validarRespostaAssistenteOrquestrador} from '../src/features/assistente/useCases/validarRespostaAssistenteOrquestrador';

test('valida e limita resposta estruturada do backend', () => {
  const resposta = validarRespostaAssistenteOrquestrador({
    protocolo: 2,
    processado: true,
    fonte: 'BACKEND',
    dominio: 'monitoramento_rotas',
    acao: 'resumir',
    texto: 'Há 3 rotas.',
    textoFalado: 'Há 3 rotas.',
    blocos: [{
      tipo: 'metricas',
      titulo: 'Hoje',
      itens: [{rotulo: 'Rotas', valor: '3', comando: 'apagar'}],
    }],
    sugestoes: ['Rotas interrompidas hoje'],
    memoria: {ultimoPeriodo: 'ultimos_30_dias', coordenadas: [-22, -47]},
    precisaEsclarecimento: false,
    esclarecimento: null,
    executar: {tipo: 'codigo_arbitrario'},
  });
  assert.equal(resposta?.processado, true);
  assert.deepEqual(resposta?.memoria, {ultimoPeriodo: 'ultimos_30_dias'});
  assert.deepEqual(resposta?.blocos[0].itens[0], {rotulo: 'Rotas', valor: '3'});
  assert.equal('executar' in (resposta ?? {}), false);
});

test('rejeita protocolo ou domínio desconhecido', () => {
  assert.equal(validarRespostaAssistenteOrquestrador({
    protocolo: 3,
    processado: true,
    fonte: 'BACKEND',
    dominio: 'sistema_operacional',
    acao: 'executar',
    texto: 'x',
    textoFalado: 'x',
    blocos: [],
    sugestoes: [],
    memoria: {},
    precisaEsclarecimento: false,
    esclarecimento: null,
  }), null);
});

test('preserva comparação e escolha pendente sem aceitar campos arbitrários', () => {
  const resposta = validarRespostaAssistenteOrquestrador({
    protocolo: 2,
    processado: true,
    fonte: 'BACKEND',
    dominio: 'monitoramento_rotas',
    acao: 'comparar_colaboradores',
    texto: 'Qual João?',
    textoFalado: 'Qual João?',
    blocos: [],
    sugestoes: ['João Silva', 'João Santos'],
    memoria: {
      ultimoColaborador: 'Maria',
      ultimoColaboradorId: 5,
      ultimoColaboradorComparacao: 'João',
      ultimoColaboradorComparacaoId: 8,
      esclarecimentoPendente: {
        ferramenta: 'monitoramento_rotas',
        acao: 'comparar_colaboradores',
        parametro: 'termoComparacao',
        parametros: {termo: 'Maria', periodo: 'ultimos_7_dias', administrador: true},
        opcoes: [
          {valor: 'João Silva', rotulo: 'João Silva — TI', id: 10},
          {valor: 'João Santos', rotulo: 'João Santos — RH', id: 11},
        ],
      },
    },
    precisaEsclarecimento: true,
    esclarecimento: 'Qual João?',
    resultadoNegocio: 'AMBIGUO',
  });

  assert.equal(resposta?.memoria.ultimoColaboradorComparacao, 'João');
  assert.deepEqual(resposta?.memoria.esclarecimentoPendente, {
    ferramenta: 'monitoramento_rotas',
    acao: 'comparar_colaboradores',
    parametro: 'termoComparacao',
    parametros: {termo: 'Maria', periodo: 'ultimos_7_dias'},
    opcoes: [
      {valor: 'João Silva', rotulo: 'João Silva — TI'},
      {valor: 'João Santos', rotulo: 'João Santos — RH'},
    ],
  });
});

test('consulta fatos no servidor e preserva ações físicas no aparelho', () => {
  assert.equal(deveConsultarOrquestrador('Resuma as rotas de Edson hoje'), true);
  assert.equal(deveConsultarOrquestrador('Últimas rotas dos 30 dias'), true);
  assert.equal(deveConsultarOrquestrador('Qual cidade tem mais filiais?'), true);
  assert.equal(deveConsultarOrquestrador('Compare João com Edson'), true);
  assert.equal(deveConsultarOrquestrador('Como foi o Carlos esta semana?'), true);
  assert.equal(deveConsultarOrquestrador('Ranking por tempo sem atualização'), true);
  assert.equal(deveConsultarOrquestrador('Traçar rota para 25 e 35'), false);
  assert.equal(deveConsultarOrquestrador('Restaurante mais próximo'), false);
  assert.equal(deveConsultarOrquestrador('Ativar modo escuro'), false);
});
