import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import type {
  PaginaUsuariosAdministrativos,
  UsuarioAdministravel,
} from '../models/AdminPasswordManagement';

/** Porta HTTP exclusiva da gestão administrativa de senhas. */
export const consultarUsuariosAdministrativos = async (
  client: AxiosInstance,
  params: {busca?: string; pagina: number; tamanhoPagina: number},
): Promise<PaginaUsuariosAdministrativos> => {
  const response = await client.get<
    StrapiSingleResponse<PaginaUsuariosAdministrativos>
  >('/painel-admin/usuarios', {params});

  return response.data.data;
};

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
