import assert from 'node:assert/strict';
import test from 'node:test';

import {iniciarNovaRotaAposInterrupcao} from '../src/features/rotas/useCases/iniciarNovaRotaAposInterrupcao';

test('não inicia uma nova rota quando a interrupção falha', async () => {
  let startCalls = 0;

  const result = await iniciarNovaRotaAposInterrupcao(
    async () => false,
    async () => {
      startCalls += 1;
      return true;
    },
  );

  assert.equal(result, false);
  assert.equal(startCalls, 0);
});

test('interrompe a rota atual antes de iniciar a nova', async () => {
  const calls: string[] = [];

  const result = await iniciarNovaRotaAposInterrupcao(
    async () => {
      calls.push('interromper');
      return true;
    },
    async () => {
      calls.push('iniciar');
      return true;
    },
  );

  assert.equal(result, true);
  assert.deepEqual(calls, ['interromper', 'iniciar']);
});
