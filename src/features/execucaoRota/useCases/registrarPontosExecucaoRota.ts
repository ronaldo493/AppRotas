import {
  MOTIVO_FINALIZACAO_ROTA,
  STATUS_EXECUCAO_ROTA,
  type NovoPontoRastreamento,
} from '../models/ExecucaoRota';
import {
  adicionarPontosRastreamento,
  atualizarProgressoDestinos,
  finalizarExecucaoRotaLocal,
  listarOcorrenciasLocalizacao,
  listarPontosExecucaoRota,
  normalizarLocalizacaoExecucao,
  obterExecucaoRota,
} from '../services/execucaoRotaDatabase';
import {calcularMetricasExecucaoRota} from './calcularMetricasExecucaoRota';

export interface ResultadoRegistroPontosExecucao {
  quantidade: number;
  concluidaAutomaticamente: boolean;
  codigoSessao: string | null;
}

let registrationQueue: Promise<void> =
  Promise.resolve();

/**
 * Persiste um lote, atualiza a confirmação incremental dos destinos e encerra
 * a execução assim que todas as paradas forem comprovadas pelo GPS.
 */
async function registrarPontosExecucaoRotaInterno(
  pontos: readonly NovoPontoRastreamento[],
): Promise<ResultadoRegistroPontosExecucao> {
  const addition =
    await adicionarPontosRastreamento(pontos);

  if (
    !addition.codigoSessao ||
    addition.pontos.length === 0
  ) {
    return {
      quantidade: addition.quantidade,
      concluidaAutomaticamente: false,
      codigoSessao: addition.codigoSessao,
    };
  }

  const visits = await atualizarProgressoDestinos(
    addition.codigoSessao,
    addition.pontos,
  );
  const execution = await obterExecucaoRota(
    addition.codigoSessao,
  );

  if (
    !execution ||
    execution.status !==
      STATUS_EXECUCAO_ROTA.EM_ANDAMENTO ||
    execution.destinos.length === 0 ||
    visits.length !== execution.destinos.length
  ) {
    return {
      quantidade: addition.quantidade,
      concluidaAutomaticamente: false,
      codigoSessao: addition.codigoSessao,
    };
  }

  const completedAt = [...visits]
    .sort(
      (first, second) =>
        new Date(second.confirmadoEm).getTime() -
        new Date(first.confirmadoEm).getTime(),
    )[0]
    .confirmadoEm;

  await normalizarLocalizacaoExecucao(
    execution.codigoSessao,
    completedAt,
  );

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
    finalizadaEm: completedAt,
    trajetoPlanejado:
      execution.trajetoPlanejado,
    ocorrenciasLocalizacao: locationEvents,
  });

  await finalizarExecucaoRotaLocal(
    execution.codigoSessao,
    STATUS_EXECUCAO_ROTA.CONCLUIDA,
    MOTIVO_FINALIZACAO_ROTA.CONCLUIDA_AUTOMATICAMENTE,
    completedAt,
    summary,
  );

  return {
    quantidade: addition.quantidade,
    concluidaAutomaticamente: true,
    codigoSessao: addition.codigoSessao,
  };
}

/**
 * Serializa entregas simultâneas da tarefa de localização. O Android pode
 * acordar duas execuções muito próximas; uma fila curta impede transações
 * exclusivas concorrentes e o erro nativo `database is locked`.
 */
export function registrarPontosExecucaoRota(
  pontos: readonly NovoPontoRastreamento[],
): Promise<ResultadoRegistroPontosExecucao> {
  const operation = registrationQueue.then(() =>
    registrarPontosExecucaoRotaInterno(pontos),
  );

  registrationQueue = operation.then(
    () => undefined,
    () => undefined,
  );

  return operation;
}
