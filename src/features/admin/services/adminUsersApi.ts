import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {PaginaUsuariosAdministrativos} from '../models/AdminPasswordManagement';

/** Consulta o diretório administrativo já limitado pelo escopo do usuário no Strapi. */
export const consultarUsuariosAdministrativos = async (
  client: AxiosInstance,
  params: {busca?: string; pagina: number; tamanhoPagina: number},
): Promise<PaginaUsuariosAdministrativos> => {
  const response = await client.get<
    StrapiSingleResponse<PaginaUsuariosAdministrativos>
  >('/painel-admin/usuarios', {params});

  return response.data.data;
};
