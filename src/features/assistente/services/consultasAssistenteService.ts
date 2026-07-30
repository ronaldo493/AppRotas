import type {AxiosInstance} from 'axios';

import type {StrapiListResponse} from '../../../core/api/strapiTypes';
import type {
  HistoricoVisita,
  TipoHistorico,
} from '../../historico/models/Historico';

interface ConsultarHistoricoInput {
  username: string;
  periodo: 'hoje' | 'geral';
  tipo?: TipoHistorico;
}

export interface ResumoHistoricoAssistente {
  total: number;
  recentes: HistoricoVisita[];
}

const obterLimitesDeHoje = (): {inicio: string; fim: string} => {
  const inicio = new Date();
  const fim = new Date();

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
  {username, periodo, tipo}: ConsultarHistoricoInput,
): Promise<ResumoHistoricoAssistente> => {
  const filters: Record<string, unknown> = {
    username: {$eq: username},
  };

  if (periodo === 'hoje') {
    const limites = obterLimitesDeHoje();

    filters.datahora = {
      $gte: limites.inicio,
      $lte: limites.fim,
    };
  }

  if (tipo) filters.tipoHistorico = {$eq: tipo};

  const response = await client.get<StrapiListResponse<HistoricoVisita>>(
    '/historico-visitas',
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
