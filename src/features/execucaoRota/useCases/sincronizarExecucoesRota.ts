import {
  MOTIVO_FINALIZACAO_ROTA,
  STATUS_EXECUCAO_ROTA,
  type ExecucaoRota,
} from '../models/ExecucaoRota';
import {appLogger} from '../../../shared/logging/appLogger';
import type {ExecucaoRotaApi} from '../services/execucaoRotaApi';
import {
  atualizarPlanejamentoExecucaoRota,
  finalizarExecucaoRotaLocal,
  limparDadosSincronizadosExecucaoRota,
  listarExecucoesPendentes,
  listarOcorrenciasLocalizacao,
  listarPontosExecucaoRota,
  marcarFinalizacaoSincronizada,
  marcarPontosComoSincronizados,
  obterExecucaoRota,
  salvarResumoExecucaoRota,
} from '../services/execucaoRotaDatabase';
import {calcularMetricasExecucaoRota} from './calcularMetricasExecucaoRota';

const POINTS_PER_BATCH = 100;

export interface ResultadoSincronizacaoExecucoes {
  execucoesSincronizadas: number;
  lotesSincronizados: number;
  falhas: number;
}

const syncOperations =
  new Map<string, Promise<ResultadoSincronizacaoExecucoes>>();

const synchronizeExecution = async (
  initialExecution: ExecucaoRota,
  api: ExecucaoRotaApi,
): Promise<{
  finalizada: boolean;
  lotes: number;
}> => {
  let execution = initialExecution;

  if (!execution.inicioSincronizado) {
    const planning = await api.iniciar(execution);

    await atualizarPlanejamentoExecucaoRota(
      execution.codigoSessao,
      planning,
    );

    execution =
      (await obterExecucaoRota(
        execution.codigoSessao,
      )) ?? execution;
  }

  let synchronizedBatches = 0;
  let conclusaoConfirmadaPeloServidor: string | null = null;

  while (true) {
    const pendingPoints =
      await listarPontosExecucaoRota(
        execution.codigoSessao,
        {
          somentePendentes: true,
          limite: POINTS_PER_BATCH,
        },
      );

    if (pendingPoints.length === 0) break;

    const firstPoint = pendingPoints[0];
    const lastPoint =
      pendingPoints[pendingPoints.length - 1];
    const batchCode = [
      execution.codigoSessao,
      firstPoint.sequencia,
      lastPoint.sequencia,
    ].join(':');

    const resultadoEnvio = await api.enviarSegmento(
      execution.codigoSessao,
      {
        codigoLote: batchCode,
        sequenciaInicial: firstPoint.sequencia,
        sequenciaFinal: lastPoint.sequencia,
        inicioEm: firstPoint.registradoEm,
        fimEm: lastPoint.registradoEm,
        pontos: pendingPoints,
      },
      execution.sessaoDispositivoCodigo,
    );
    await marcarPontosComoSincronizados(
      pendingPoints.map(point => point.id),
    );

    synchronizedBatches += 1;

    if (resultadoEnvio.finalizadaAutomaticamente === true) {
      conclusaoConfirmadaPeloServidor =
        resultadoEnvio.finalizadaEm ??
        lastPoint.registradoEm;
    }
  }

  if (
    conclusaoConfirmadaPeloServidor &&
    execution.status === STATUS_EXECUCAO_ROTA.EM_ANDAMENTO
  ) {
    const [allPoints, locationEvents] = await Promise.all([
      listarPontosExecucaoRota(execution.codigoSessao),
      listarOcorrenciasLocalizacao(execution.codigoSessao),
    ]);
    const summary = calcularMetricasExecucaoRota({
      pontos: allPoints,
      destinos: execution.destinos,
      iniciadaEm: execution.iniciadaEm,
      finalizadaEm: conclusaoConfirmadaPeloServidor,
      trajetoPlanejado: execution.trajetoPlanejado,
      ocorrenciasLocalizacao: locationEvents,
    });

    await finalizarExecucaoRotaLocal(
      execution.codigoSessao,
      STATUS_EXECUCAO_ROTA.CONCLUIDA,
      MOTIVO_FINALIZACAO_ROTA.CONCLUIDA_AUTOMATICAMENTE,
      conclusaoConfirmadaPeloServidor,
      summary,
    );
    await marcarFinalizacaoSincronizada(
      execution.codigoSessao,
    );

    return {
      finalizada: true,
      lotes: synchronizedBatches,
    };
  }

  if (
    execution.status ===
      STATUS_EXECUCAO_ROTA.EM_ANDAMENTO ||
    execution.finalizacaoSincronizada ||
    !execution.finalizadaEm
  ) {
    return {
      finalizada: false,
      lotes: synchronizedBatches,
    };
  }

  const [allPoints, locationEvents] =
    await Promise.all([
      listarPontosExecucaoRota(
        execution.codigoSessao,
      ),
      listarOcorrenciasLocalizacao(
        execution.codigoSessao,
      ),
    ]);
  const summary = calcularMetricasExecucaoRota({
    pontos: allPoints,
    destinos: execution.destinos,
    iniciadaEm: execution.iniciadaEm,
    finalizadaEm: execution.finalizadaEm,
    trajetoPlanejado:
      execution.trajetoPlanejado,
    ocorrenciasLocalizacao: locationEvents,
  });

  await salvarResumoExecucaoRota(
    execution.codigoSessao,
    summary,
  );
  await api.finalizar(execution, summary);
  await marcarFinalizacaoSincronizada(
    execution.codigoSessao,
  );

  return {
    finalizada: true,
    lotes: synchronizedBatches,
  };
};

/**
 * Sincroniza somente dados do proprietário informado e serializa tentativas
 * concorrentes. Os códigos de sessão e lote tornam as requisições idempotentes.
 */
export function sincronizarExecucoesRota(
  ownerKey: string,
  api: ExecucaoRotaApi,
): Promise<ResultadoSincronizacaoExecucoes> {
  const activeOperation = syncOperations.get(ownerKey);

  if (activeOperation) return activeOperation;

  const operation = (async () => {
    const result: ResultadoSincronizacaoExecucoes = {
      execucoesSincronizadas: 0,
      lotesSincronizados: 0,
      falhas: 0,
    };
    const pendingExecutions =
      await listarExecucoesPendentes(ownerKey);

    if (pendingExecutions.length === 0) {
      return result;
    }

    for (const execution of pendingExecutions) {
      try {
        const synchronized =
          await synchronizeExecution(
            execution,
            api,
          );

        result.lotesSincronizados +=
          synchronized.lotes;

        if (synchronized.finalizada) {
          result.execucoesSincronizadas += 1;
        }
      } catch (error: unknown) {
        result.falhas += 1;

        appLogger.warn(
          `Execução ${execution.codigoSessao} permanece pendente para sincronização:`,
          error instanceof Error
            ? error.message
            : 'erro desconhecido',
        );
      }
    }

    await limparDadosSincronizadosExecucaoRota();

    return result;
  })();

  syncOperations.set(ownerKey, operation);

  return operation.finally(() => {
    if (syncOperations.get(ownerKey) === operation) {
      syncOperations.delete(ownerKey);
    }
  });
}
