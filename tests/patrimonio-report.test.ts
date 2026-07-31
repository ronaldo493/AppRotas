import assert from 'node:assert/strict';
import test from 'node:test';

import createPatrimonioReport from '../src/features/patrimonio/domain/createPatrimonioReport.ts';

test('mantém o formato atual do relatório de patrimônio', () => {
  const report = createPatrimonioReport({
    filial: '25',
    serviceType: 'PREVENTIVA',
    fields: {
      'Caixa G': {
        'Máquina:': {
          patrimonio: '123456',
          option: null,
        },
        'Leitor:': {
          patrimonio: '654321',
          option: 'qd',
        },
      },
    },
  });

  assert.deepEqual(report, {
    categoria: 'PREVENTIVA',
    filial: '25',
    secoes: {
      'Caixa G': {
        'Máquina:': '123456',
        'Leitor:': '654321 (qd)',
      },
    },
  });
});

test('inicia um relatório novo sem reaproveitar seções anteriores', () => {
  const report = createPatrimonioReport({
    filial: '35',
    serviceType: 'MONTAGEM',
    fields: {},
  });

  assert.deepEqual(report.secoes, {});
});
