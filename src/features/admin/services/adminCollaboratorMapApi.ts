import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {AdminCollaboratorMapData} from '../models/AdminCollaboratorMap';
import {mapearRespostaMapaColaboradores} from '../useCases/mapAdminCollaboratorMapResponse';

/** Consulta o read model seguro; nunca acessa diretamente sessões no Strapi. */
export async function consultarAdminCollaboratorMap(
  client: AxiosInstance,
): Promise<AdminCollaboratorMapData> {
  const response = await client.get<
    StrapiSingleResponse<AdminCollaboratorMapData>
  >('/painel-admin/colaboradores/localizacoes', {
    timeout: 8_000,
    'axios-retry': {retries: 1},
  });
  return mapearRespostaMapaColaboradores(response.data.data);
}
