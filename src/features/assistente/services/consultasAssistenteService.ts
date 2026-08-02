import type {AxiosInstance} from 'axios';

import type {StrapiListResponse} from '../../../core/api/strapiTypes';
import type {
  HistoricoVisita,
  TipoHistorico,
} from '../../historico/models/Historico';
import type {PeriodoHistoricoAssistente} from '../models/ComandoAssistente';

interface ConsultarHistoricoInput {
  periodo: PeriodoHistoricoAssistente;
  tipo?: TipoHistorico;
}

export interface ResumoHistoricoAssistente {
  total: number;
  recentes: HistoricoVisita[];
}

const obterIntervalo = (
  periodo: Exclude<PeriodoHistoricoAssistente, 'geral'>,
): {inicio: string; fim: string} => {
  const inicio = new Date();
  const fim = new Date();

  if (periodo === 'ontem') {
    inicio.setDate(inicio.getDate() - 1);
    fim.setDate(fim.getDate() - 1);
  } else if (periodo === 'ultimos_7_dias') {
    inicio.setDate(inicio.getDate() - 6);
  } else if (periodo === 'mes_atual') {
    inicio.setDate(1);
  }

  inicio.setHours(0, 0, 0, 0);
  fim.setHours(23, 59, 59, 999);

  return {
    inicio: inicio.toISOString(),
    fim: fim.toISOString(),
  };
};

/**
 * Consulta somente os dados necessários para o resumo, sem substituir a lista
 * e os filtros mantidos pela tela de histórico.
 */
export const consultarHistoricoAssistente = async (
  client: AxiosInstance,
  {periodo, tipo}: ConsultarHistoricoInput,
): Promise<ResumoHistoricoAssistente> => {
  const filters: Record<string, unknown> = {};

  if (periodo !== 'geral') {
    const limites = obterIntervalo(periodo);

    filters.datahora = {
      $gte: limites.inicio,
      $lte: limites.fim,
    };
  }

  if (tipo) filters.tipoHistorico = {$eq: tipo};

  const response = await client.get<StrapiListResponse<HistoricoVisita>>(
    '/historico-visitas/me',
    {
      params: {
        filters,
        sort: ['datahora:desc'],
        pagination: {
          page: 1,
          pageSize: 5,
        },
      },
    },
  );

  return {
    total: response.data.meta.pagination.total,
    recentes: response.data.data,
  };
};
