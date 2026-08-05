import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {AdminRouteMapData} from '../models/AdminRouteMap';

/** Busca a geometria somente quando o gestor solicita o mapa do percurso. */
export const consultarAdminRouteMap = async (
  client: AxiosInstance,
  codigoSessao: string,
): Promise<AdminRouteMapData> => {
  const response = await client.get<StrapiSingleResponse<AdminRouteMapData>>(
    `/painel-admin/rotas/${encodeURIComponent(codigoSessao)}/trajeto`,
  );

  return response.data.data;
};
