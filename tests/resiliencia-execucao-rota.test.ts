import assert from 'node:assert/strict';
import test from 'node:test';

import {
  prepareSessionTermination,
  registerSessionTerminationPreparation,
} from '../src/core/auth/sessionTerminationCoordinator';
import {isTransientSqliteLock, runRouteDatabaseWrite} from '../src/features/execucaoRota/services/execucaoRotaDatabaseWriteQueue';
import {definirFluxoMonitoramentoRota} from '../src/features/execucaoRota/useCases/definirFluxoMonitoramentoRota';
import {canSynchronizeRouteInBackground} from '../src/features/execucaoRota/domain/backgroundRouteSyncPolicy';

test('mantém o monitoramento conhecido quando o Strapi fica offline', () => {
  assert.deepEqual(
    definirFluxoMonitoramentoRota({
      habilitado: true,
      atualizadoEm: Date.now(),
      obtidoDoServidor: false,
      origem: 'cache',
    }),
    {
      monitorar: true,
      exibirPrevia: false,
      configuracaoOffline: true,
    },
  );
});

test('sincroniza lote em segundo plano somente na sessão que iniciou a rota', () => {
  assert.equal(
    canSynchronizeRouteInBackground({
      executionOwnerKey: 'id:25',
      authenticatedOwnerKey: 'id:25',
      executionDeviceSessionCode: 'aparelho-a',
      activeDeviceSessionCode: 'aparelho-a',
    }),
    true,
  );

  assert.equal(
    canSynchronizeRouteInBackground({
      executionOwnerKey: 'id:25',
      authenticatedOwnerKey: 'id:25',
      executionDeviceSessionCode: 'aparelho-a',
      activeDeviceSessionCode: 'aparelho-b',
    }),
    false,
  );

  assert.equal(
    canSynchronizeRouteInBackground({
      executionOwnerKey: 'id:25',
      authenticatedOwnerKey: 'id:48',
      executionDeviceSessionCode: 'aparelho-a',
      activeDeviceSessionCode: 'aparelho-a',
    }),
    false,
  );
});

test('não ativa monitoramento sem configuração conhecida', () => {
  assert.deepEqual(
    definirFluxoMonitoramentoRota({
      habilitado: false,
      atualizadoEm: Date.now(),
      obtidoDoServidor: false,
      origem: 'indisponivel',
    }),
    {
      monitorar: false,
      exibirPrevia: false,
      configuracaoOffline: false,
    },
  );
});

test('serializa gravações concorrentes do banco de rotas', async () => {
  const events: string[] = [];
  const first = runRouteDatabaseWrite(async () => {
    events.push('primeira-inicio');
    await new Promise(resolve => setTimeout(resolve, 20));
    events.push('primeira-fim');
  });
  const second = runRouteDatabaseWrite(async () => {
    events.push('segunda-inicio');
    events.push('segunda-fim');
  });

  await Promise.all([first, second]);

  assert.deepEqual(events, [
    'primeira-inicio',
    'primeira-fim',
    'segunda-inicio',
    'segunda-fim',
  ]);
});

test('repete um bloqueio transitório do SQLite sem quebrar a fila', async () => {
  let attempts = 0;

  const result = await runRouteDatabaseWrite(async () => {
    attempts += 1;

    if (attempts < 3) {
      throw new Error('database is locked');
    }

    return 'gravado';
  });

  assert.equal(result, 'gravado');
  assert.equal(attempts, 3);
  assert.equal(
    isTransientSqliteLock(
      new Error('SQLITE_BUSY: database is locked'),
    ),
    true,
  );
});

test('uma gravação inválida não bloqueia as gravações seguintes', async () => {
  await assert.rejects(
    runRouteDatabaseWrite(async () => {
      throw new Error('falha permanente');
    }),
    /falha permanente/,
  );

  assert.equal(
    await runRouteDatabaseWrite(async () => 'recuperada'),
    'recuperada',
  );
});

test('prepara a execução antes de remover a sessão', async () => {
  let prepared = false;
  const unregister = registerSessionTerminationPreparation(
    async () => {
      prepared = true;
    },
  );

  assert.equal(
    await prepareSessionTermination(100),
    'completed',
  );
  assert.equal(prepared, true);
  unregister();
});

test('o logout não fica bloqueado por uma preparação travada', async () => {
  const unregister = registerSessionTerminationPreparation(
    () => new Promise(() => undefined),
  );

  assert.equal(
    await prepareSessionTermination(10),
    'timeout',
  );
  unregister();
});

test('uma falha na preparação não impede a remoção da sessão', async () => {
  const unregister = registerSessionTerminationPreparation(
    async () => {
      throw new Error('Strapi indisponível');
    },
  );

  assert.equal(
    await prepareSessionTermination(100),
    'failed',
  );
  unregister();
});
