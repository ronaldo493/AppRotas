import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {AdminActiveRoutesMapData} from '../models/AdminActiveRoutesMap';
import {mapearRespostaMapaRotasAtivas} from '../useCases/mapAdminActiveRoutesMapResponse';

/** Consulta somente as execuções em andamento autorizadas pelo backend. */
export async function consultarMapaRotasAtivas(
  client: AxiosInstance,
): Promise<AdminActiveRoutesMapData> {
  const response = await client.get<StrapiSingleResponse<unknown>>(
    '/painel-admin/colaboradores/localizacoes',
    {
      timeout: 8_000,
      'axios-retry': {retries: 1},
    },
  );
  return mapearRespostaMapaRotasAtivas(response.data.data);
}
