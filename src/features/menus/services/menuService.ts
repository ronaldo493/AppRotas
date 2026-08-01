import type {AxiosInstance} from 'axios';

import type {MenuItem} from '../../../core/menu/Menu';

interface MenuCollectionResponse {
  data?: unknown;
}

const isMenuItem = (value: unknown): value is MenuItem => {
  if (typeof value !== 'object' || value === null) return false;

  const menu = value as Partial<MenuItem>;

  return (
    typeof menu.titulo === 'string'
    && menu.titulo.trim().length > 0
    && typeof menu.rota === 'string'
    && menu.rota.trim().length > 0
    && menu.ativo === true
    && typeof menu.ordem === 'number'
    && Number.isFinite(menu.ordem)
    && (
      menu.icone === null
      || typeof menu.icone === 'string'
    )
  );
};

/**
 * Consulta os menus já autorizados pelo Strapi para o usuário do JWT. Uma
 * resposta fora do contrato preserva os acessos locais existentes.
 */
export async function buscarMenusPermitidos(
  client: AxiosInstance,
  jwt: string,
): Promise<MenuItem[]> {
  const response = await client.get<MenuCollectionResponse>(
    '/menus/me',
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  );

  if (!Array.isArray(response.data.data)) {
    throw new Error('O Strapi retornou uma coleção de menus inválida.');
  }

  if (!response.data.data.every(isMenuItem)) {
    throw new Error('O Strapi retornou menus fora do contrato esperado.');
  }

  return response.data.data;
}
