import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {UsuarioAdministravel} from '../models/AdminPasswordManagement';

/** O app envia somente o usuário; senha padrão e escopo pertencem ao backend. */
export const redefinirSenhaAdministrativa = async (
  client: AxiosInstance,
  usuarioId: number,
): Promise<UsuarioAdministravel> => {
  const response = await client.post<StrapiSingleResponse<UsuarioAdministravel>>(
    `/painel-admin/usuarios/${usuarioId}/redefinir-senha`,
  );

  return response.data.data;
};
