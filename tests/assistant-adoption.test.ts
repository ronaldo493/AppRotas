import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DICA_DESCOBERTA_ASSISTENTE,
  EXEMPLOS_INICIAIS_ASSISTENTE,
  obterChaveDataLocal,
  obterSugestaoContextualAssistente,
  podeExibirDicaDescoberta,
} from '../src/features/assistente/adoption/useCases/obterSugestaoContextualAssistente';

test('oferece orientações coerentes com as principais telas do aplicativo', () => {
  const cenarios = [
    ['MapaLojas', 'filiais'],
    ['Pontos', 'pontos'],
    ['Contatos', 'contatos'],
    ['Historico', 'historico'],
    ['Admin', 'admin'],
  ] as const;

  for (const [tela, idEsperado] of cenarios) {
    const sugestao = obterSugestaoContextualAssistente(tela);
    assert.ok(sugestao);
    assert.equal(sugestao.id, idEsperado);
    assert.ok(sugestao.mensagem.length > 10);
    assert.ok(sugestao.pergunta.endsWith('?') || sugestao.pergunta.endsWith('.'));
  }
});

test('não inventa sugestão para rota desconhecida', () => {
  assert.equal(obterSugestaoContextualAssistente('TelaFutura'), null);
  assert.equal(obterSugestaoContextualAssistente(undefined), null);
});

test('apresentação inicial mantém três exemplos curtos e acionáveis', () => {
  assert.equal(EXEMPLOS_INICIAIS_ASSISTENTE.length, 3);
  assert.equal(new Set(EXEMPLOS_INICIAIS_ASSISTENTE).size, 3);
  assert.ok(EXEMPLOS_INICIAIS_ASSISTENTE.every(item => item.length <= 80));
});
test('descoberta aparece no máximo duas vezes e nunca no mesmo dia', () => {
  const base = {
    assistenteDescoberta: false,
    apresentacaoVisualizada: false,
    datasDicaDescobertaExibida: [],
    totalDicasExibidas: 0,
    telasComDica: [],
  };

  assert.equal(podeExibirDicaDescoberta(base, '2026-08-18'), true);
  assert.equal(podeExibirDicaDescoberta({
    ...base,
    datasDicaDescobertaExibida: ['2026-08-18'],
  }, '2026-08-18'), false);
  assert.equal(podeExibirDicaDescoberta({
    ...base,
    datasDicaDescobertaExibida: ['2026-08-17'],
  }, '2026-08-18'), true);
  assert.equal(podeExibirDicaDescoberta({
    ...base,
    datasDicaDescobertaExibida: ['2026-08-16', '2026-08-17'],
  }, '2026-08-18'), false);
});

test('abrir a assistente encerra definitivamente a descoberta', () => {
  const estado = {
    assistenteDescoberta: true,
    apresentacaoVisualizada: true,
    datasDicaDescobertaExibida: [],
    totalDicasExibidas: 0,
    telasComDica: [],
  };
  assert.equal(podeExibirDicaDescoberta(estado, '2026-08-18'), false);
  assert.equal(DICA_DESCOBERTA_ASSISTENTE.pergunta, '');
  assert.equal(DICA_DESCOBERTA_ASSISTENTE.tipo, 'descoberta');
});

test('data da descoberta respeita o calendário local do aparelho', () => {
  assert.equal(obterChaveDataLocal(new Date(2026, 7, 18, 23, 59)), '2026-08-18');
});