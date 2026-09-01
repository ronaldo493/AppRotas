import assert from 'node:assert/strict';
import test from 'node:test';

import {
  prepareSessionTermination,
  registerSessionTerminationPreparation,
} from '../src/core/auth/sessionTerminationCoordinator';
import {isTransientSqliteLock, runRouteDatabaseWrite} from '../src/features/execucaoRota/services/execucaoRotaDatabaseWriteQueue';
import {definirFluxoMonitoramentoRota} from '../src/features/execucaoRota/useCases/definirFluxoMonitoramentoRota';
import {canSynchronizeRouteInBackground} from '../src/features/execucaoRota/domain/backgroundRouteSyncPolicy';
import {
  criarCoordenadorServicoRastreamento,
  iniciarServicoRastreamentoComRetentativa,
} from '../src/features/execucaoRota/useCases/coordenarServicoRastreamento';

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

test('repete a inicialização do GPS após uma falha transitória', async () => {
  let ativo = false;
  let tentativas = 0;
  const esperas: number[] = [];

  await iniciarServicoRastreamentoComRetentativa(
    {
      estaAtivo: async () => ativo,
      iniciar: async () => {
        tentativas += 1;

        if (tentativas === 1) {
          throw new Error('serviço anterior ainda encerrando');
        }

        ativo = true;
      },
      parar: async () => undefined,
    },
    {
      atrasosRetentativaMs: [10, 20],
      intervaloAposParadaMs: 30,
    },
    {
      agora: () => 0,
      aguardar: async tempoMs => {
        esperas.push(tempoMs);
      },
    },
  );

  assert.equal(tentativas, 2);
  assert.deepEqual(esperas, [10]);
});

test('aceita o serviço quando o Android o ativou apesar do erro retornado', async () => {
  let ativo = false;
  let tentativas = 0;
  const esperas: number[] = [];

  await iniciarServicoRastreamentoComRetentativa(
    {
      estaAtivo: async () => ativo,
      iniciar: async () => {
        tentativas += 1;
        ativo = true;
        throw new Error('resposta nativa rejeitada');
      },
      parar: async () => undefined,
    },
    {
      atrasosRetentativaMs: [10, 20],
      intervaloAposParadaMs: 30,
    },
    {
      agora: () => 0,
      aguardar: async tempoMs => {
        esperas.push(tempoMs);
      },
    },
  );

  assert.equal(tentativas, 1);
  assert.deepEqual(esperas, []);
});

test('mantém o erro original depois de esgotar as tentativas do GPS', async () => {
  let tentativas = 0;
  const esperas: number[] = [];

  await assert.rejects(
    iniciarServicoRastreamentoComRetentativa(
      {
        estaAtivo: async () => false,
        iniciar: async () => {
          tentativas += 1;
          throw new Error('GPS indisponível');
        },
        parar: async () => undefined,
      },
      {
        atrasosRetentativaMs: [10, 20],
        intervaloAposParadaMs: 30,
      },
      {
        agora: () => 0,
        aguardar: async tempoMs => {
          esperas.push(tempoMs);
        },
      },
    ),
    /GPS indisponível/,
  );

  assert.equal(tentativas, 3);
  assert.deepEqual(esperas, [10, 20]);
});

test('a configuração de produção executa três tentativas com espera progressiva', async () => {
  let tentativas = 0;
  const esperas: number[] = [];

  await assert.rejects(
    iniciarServicoRastreamentoComRetentativa(
      {
        estaAtivo: async () => false,
        iniciar: async () => {
          tentativas += 1;
          throw new Error('serviço indisponível');
        },
        parar: async () => undefined,
      },
      undefined,
      {
        agora: () => 0,
        aguardar: async tempoMs => {
          esperas.push(tempoMs);
        },
      },
    ),
    /serviço indisponível/,
  );

  assert.equal(tentativas, 3);
  assert.deepEqual(esperas, [750, 1_500]);
});

test('serializa parada e novo início respeitando o intervalo de segurança', async () => {
  let ativo = true;
  let agora = 1_000;
  let inicios = 0;
  const eventos: string[] = [];
  const esperas: number[] = [];
  const coordenador = criarCoordenadorServicoRastreamento(
    {
      estaAtivo: async () => ativo,
      iniciar: async () => {
        eventos.push('iniciar');
        inicios += 1;
        ativo = true;
      },
      parar: async () => {
        eventos.push('parar');
        ativo = false;
      },
    },
    {
      atrasosRetentativaMs: [10, 20],
      intervaloAposParadaMs: 1_200,
    },
    {
      agora: () => agora,
      aguardar: async tempoMs => {
        esperas.push(tempoMs);
        agora += tempoMs;
      },
    },
  );

  await Promise.all([
    coordenador.parar(),
    coordenador.iniciar(),
    coordenador.iniciar(),
  ]);

  assert.deepEqual(eventos, ['parar', 'iniciar']);
  assert.equal(inicios, 1);
  assert.deepEqual(esperas, [1_200]);
});

test('duas inicializações simultâneas acionam o serviço nativo uma única vez', async () => {
  let ativo = false;
  let inicios = 0;
  let liberarInicio: (() => void) | null = null;
  let confirmarEntrada: (() => void) | null = null;
  const entradaNoServico = new Promise<void>(resolve => {
    confirmarEntrada = resolve;
  });
  const coordenador = criarCoordenadorServicoRastreamento(
    {
      estaAtivo: async () => ativo,
      iniciar: async () => {
        inicios += 1;
        confirmarEntrada?.();

        await new Promise<void>(resolve => {
          liberarInicio = resolve;
        });
        ativo = true;
      },
      parar: async () => {
        ativo = false;
      },
    },
    {
      atrasosRetentativaMs: [10, 20],
      intervaloAposParadaMs: 30,
    },
    {
      agora: () => 0,
      aguardar: async () => undefined,
    },
  );

  const primeiroInicio = coordenador.iniciar();
  await entradaNoServico;
  const segundoInicio = coordenador.iniciar();
  const concluirInicio = liberarInicio as (() => void) | null;

  assert.ok(concluirInicio);
  concluirInicio();
  await Promise.all([primeiroInicio, segundoInicio]);

  assert.equal(inicios, 1);
});

test('uma inicialização rejeitada não bloqueia operações posteriores', async () => {
  let ativo = false;
  let deveFalhar = true;
  let inicios = 0;
  const coordenador = criarCoordenadorServicoRastreamento(
    {
      estaAtivo: async () => ativo,
      iniciar: async () => {
        inicios += 1;

        if (deveFalhar) {
          throw new Error('falha nativa permanente');
        }

        ativo = true;
      },
      parar: async () => {
        ativo = false;
      },
    },
    {
      atrasosRetentativaMs: [],
      intervaloAposParadaMs: 30,
    },
    {
      agora: () => 0,
      aguardar: async () => undefined,
    },
  );

  await assert.rejects(
    coordenador.iniciar(),
    /falha nativa permanente/,
  );

  deveFalhar = false;
  await coordenador.iniciar();

  assert.equal(ativo, true);
  assert.equal(inicios, 2);
});

test('parada sem serviço ativo não impõe espera ao próximo início', async () => {
  let ativo = false;
  const esperas: number[] = [];
  const coordenador = criarCoordenadorServicoRastreamento(
    {
      estaAtivo: async () => ativo,
      iniciar: async () => {
        ativo = true;
      },
      parar: async () => {
        ativo = false;
      },
    },
    {
      atrasosRetentativaMs: [10, 20],
      intervaloAposParadaMs: 1_200,
    },
    {
      agora: () => 1_000,
      aguardar: async tempoMs => {
        esperas.push(tempoMs);
      },
    },
  );

  await coordenador.parar();
  await coordenador.iniciar();

  assert.deepEqual(esperas, []);
  assert.equal(ativo, true);
});
