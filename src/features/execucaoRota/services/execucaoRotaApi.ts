import type {AxiosInstance} from 'axios';

import type {
  ExecucaoRota,
  PlanejamentoExecucaoRota,
  PontoRastreamento,
  ResumoExecucaoRota,
} from '../models/ExecucaoRota';
import {DEVICE_SESSION_HEADER} from '../../../core/auth/deviceSession/services/deviceSessionService';

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

export interface ResultadoEnvioSegmentoRota {
  codigoLote: string;
  recebido: boolean;
  duplicado: boolean;
  finalizadaAutomaticamente?: boolean;
  situacaoExecucao?: string | null;
  finalizadaEm?: string | null;
  motivoFinalizacao?: string | null;
}

export interface ExecucaoRotaApi {
  iniciar: (
    execution: ExecucaoRota,
  ) => Promise<PlanejamentoExecucaoRota>;
  enviarSegmento: (
    codigoSessao: string,
    segment: SegmentoExecucaoRota,
    deviceSessionCode?: string | null,
  ) => Promise<ResultadoEnvioSegmentoRota>;
  finalizar: (
    execution: ExecucaoRota,
    summary: ResumoExecucaoRota,
  ) => Promise<void>;
  enviarTelemetria: (
    codigoSessao: string,
    evento: TelemetriaOperacionalRota,
    deviceSessionCode?: string | null,
  ) => Promise<void>;
}

export type TipoTelemetriaOperacionalRota =
  | 'rastreamento_iniciado'
  | 'rastreamento_confirmado'
  | 'localizacao_recebida'
  | 'gps_indisponivel'
  | 'permissao_revogada'
  | 'servico_interrompido'
  | 'aplicativo_primeiro_plano'
  | 'sincronizacao_pendente'
  | 'lote_enviado';

export interface TelemetriaOperacionalRota {
  tipo: TipoTelemetriaOperacionalRota;
  ocorridoEm: string;
  pontosPendentes: number;
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
        execution.sessaoDispositivoCodigo
          ? {
              headers: {
                [DEVICE_SESSION_HEADER]:
                  execution.sessaoDispositivoCodigo,
              },
            }
          : undefined,
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
      deviceSessionCode,
    ) => {
      const response = await client.post(
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
        deviceSessionCode
          ? {
              headers: {
                [DEVICE_SESSION_HEADER]: deviceSessionCode,
              },
            }
          : undefined,
      );

      return unwrapResponse<ResultadoEnvioSegmentoRota>(
        response.data,
      );
    },

    enviarTelemetria: async (
      codigoSessao,
      evento,
      deviceSessionCode,
    ) => {
      await client.post(
        `/execucoes-rotas/${encodeURIComponent(codigoSessao)}/telemetria`,
        evento,
        deviceSessionCode
          ? {headers: {[DEVICE_SESSION_HEADER]: deviceSessionCode}}
          : undefined,
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
        execution.sessaoDispositivoCodigo
          ? {
              headers: {
                [DEVICE_SESSION_HEADER]:
                  execution.sessaoDispositivoCodigo,
              },
            }
          : undefined,
      );
    },
  };
}
