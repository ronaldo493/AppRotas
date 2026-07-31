import type {AxiosInstance} from 'axios';

import type {
  ExecucaoRota,
  PlanejamentoExecucaoRota,
  PontoRastreamento,
  ResumoExecucaoRota,
} from '../models/ExecucaoRota';

interface IniciarExecucaoRotaResponse {
  documentId?: string | null;
  servidorDocumentId?: string | null;
  trajetoPlanejado?: string | null;
  distanciaPlanejadaMetros?: number | null;
  duracaoPlanejadaSegundos?: number | null;
}

const unwrapResponse = <T>(value: unknown): T => {
  if (
    value &&
    typeof value === 'object' &&
    'data' in value
  ) {
    return (value as {data: T}).data;
  }

  return value as T;
};

export interface SegmentoExecucaoRota {
  codigoLote: string;
  sequenciaInicial: number;
  sequenciaFinal: number;
  inicioEm: string;
  fimEm: string;
  pontos: PontoRastreamento[];
}

export interface ExecucaoRotaApi {
  iniciar: (
    execution: ExecucaoRota,
  ) => Promise<PlanejamentoExecucaoRota>;
  enviarSegmento: (
    codigoSessao: string,
    segment: SegmentoExecucaoRota,
  ) => Promise<void>;
  finalizar: (
    execution: ExecucaoRota,
    summary: ResumoExecucaoRota,
  ) => Promise<void>;
}

/**
 * Centraliza o contrato HTTP das execuções. As telas não conhecem endpoints,
 * formato do Strapi ou detalhes de autenticação.
 */
export function criarExecucaoRotaApi(
  client: AxiosInstance,
): ExecucaoRotaApi {
  return {
    iniciar: async execution => {
      const response = await client.post(
        '/execucoes-rotas/iniciar',
        {
          codigoSessao: execution.codigoSessao,
          navegador: execution.navegador,
          iniciadaEm: execution.iniciadaEm,
          cidadeOrigem: execution.cidadeOrigem,
          origem: execution.origem,
          destinos: execution.destinos,
          planejamento:
            execution.trajetoPlanejado &&
            execution.distanciaPlanejadaMetros !==
              null &&
            execution.duracaoPlanejadaSegundos !==
              null
              ? {
                  trajetoPlanejado:
                    execution.trajetoPlanejado,
                  distanciaPlanejadaMetros:
                    execution.distanciaPlanejadaMetros,
                  duracaoPlanejadaSegundos:
                    execution.duracaoPlanejadaSegundos,
                }
              : undefined,
          versaoAplicativo:
            execution.versaoAplicativo,
        },
      );
      const data =
        unwrapResponse<IniciarExecucaoRotaResponse>(
          response.data,
        );

      return {
        servidorDocumentId:
          data.servidorDocumentId ??
          data.documentId ??
          null,
        trajetoPlanejado:
          data.trajetoPlanejado ?? null,
        distanciaPlanejadaMetros:
          data.distanciaPlanejadaMetros ?? null,
        duracaoPlanejadaSegundos:
          data.duracaoPlanejadaSegundos ?? null,
      };
    },

    enviarSegmento: async (
      codigoSessao,
      segment,
    ) => {
      await client.post(
        `/execucoes-rotas/${encodeURIComponent(
          codigoSessao,
        )}/segmentos`,
        {
          codigoLote: segment.codigoLote,
          sequenciaInicial:
            segment.sequenciaInicial,
          sequenciaFinal:
            segment.sequenciaFinal,
          inicioEm: segment.inicioEm,
          fimEm: segment.fimEm,
          pontos: segment.pontos.map(point => ({
            sequencia: point.sequencia,
            latitude: point.latitude,
            longitude: point.longitude,
            precisao: point.precisao,
            velocidade: point.velocidade,
            direcao: point.direcao,
            registradoEm: point.registradoEm,
          })),
        },
      );
    },

    finalizar: async (execution, summary) => {
      await client.post(
        `/execucoes-rotas/${encodeURIComponent(
          execution.codigoSessao,
        )}/finalizar`,
        {
          situacaoExecucao: execution.status,
          finalizadaEm: execution.finalizadaEm,
          motivoFinalizacao:
            execution.motivoFinalizacao,
          resumo: summary,
        },
      );
    },
  };
}
