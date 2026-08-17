import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {
  FiltroResultadoViagemAdmin,
  PaginaPainelAdminRotas,
  SituacaoExecucaoAdmin,
} from '../models/AdminRouteDashboard';

export interface ConsultarPainelAdminParams {
  inicio: string;
  fim: string;
  situacao?: SituacaoExecucaoAdmin;
  resultado?: Exclude<FiltroResultadoViagemAdmin, 'todas'>;
  busca?: string;
  pagina: number;
  tamanhoPagina: number;
}

/** Única porta HTTP da feature administrativa de monitoramento de rotas. */
export const consultarPainelAdminRotas = async (
  client: AxiosInstance,
  params: ConsultarPainelAdminParams,
): Promise<PaginaPainelAdminRotas> => {
  const response = await client.get<StrapiSingleResponse<PaginaPainelAdminRotas>>(
    '/painel-admin/rotas/resumo',
    {params},
  );

  return response.data.data;
};
