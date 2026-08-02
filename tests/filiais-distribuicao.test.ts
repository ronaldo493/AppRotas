import assert from 'node:assert/strict';
import test from 'node:test';

import type {Filial} from '../src/features/filiais/models/Filial';
import {
  analisarDistribuicaoFiliais,
  filialPertenceAoGrupo,
} from '../src/features/filiais/useCases/analisarDistribuicaoFiliais';

const filiais: Filial[] = [
  {codigofilial: 1, nomefilial: 'Centro', nomecidade: 'Piracicaba', uf: 'SP'},
  {codigofilial: 2, nomefilial: 'Norte', nomecidade: 'Piracicaba', uf: 'sp'},
  {codigofilial: 3, nomefilial: 'Centro', nomecidade: 'Campinas', uf: 'SP'},
  {codigofilial: 4, nomefilial: 'Centro', nomecidade: 'Curitiba', uf: 'PR'},
  {codigofilial: 5, nomefilial: 'Sem cidade', nomecidade: '', uf: ''},
  {codigofilial: 1, nomefilial: 'Duplicada', nomecidade: 'Outra', uf: 'MG'},
];

test('resume cidades e estados sem duplicar códigos de filial', () => {
  const resumo = analisarDistribuicaoFiliais(filiais);

  assert.equal(resumo.totalFiliais, 5);
  assert.equal(resumo.totalCidades, 3);
  assert.equal(resumo.totalEstados, 2);
  assert.deepEqual(resumo.cidadeDestaque, {
    chave: 'piracicaba',
    rotulo: 'Piracicaba',
    quantidade: 2,
    percentual: 40,
  });
  assert.deepEqual(resumo.estadoDestaque, {
    chave: 'sp',
    rotulo: 'SP',
    quantidade: 3,
    percentual: 60,
  });
});

test('compara filtros ignorando caixa e acentuação', () => {
  assert.equal(
    filialPertenceAoGrupo(
      {codigofilial: 10, nomefilial: 'Centro', nomecidade: 'São Paulo', uf: 'SP'},
      'cidade',
      'sao paulo',
    ),
    true,
  );
  assert.equal(
    filialPertenceAoGrupo(filiais[3], 'estado', 'pr'),
    true,
  );
  assert.equal(
    filialPertenceAoGrupo(filiais[3], 'estado', 'sp'),
    false,
  );
});
