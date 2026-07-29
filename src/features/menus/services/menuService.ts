import type {AxiosInstance} from 'axios';

import type {MenuRecord} from '../models/MenuRecord';

interface MenuCollectionResponse {
  data?: unknown;
}

const isMenuRecord = (value: unknown): value is MenuRecord =>
  typeof value === 'object' && value !== null;

/**
 * Consulta no Strapi os menus e seus setores relacionados. Uma resposta fora
 * do contrato gera erro para que os acessos locais existentes sejam mantidos.
 */
export async function buscarMenus(client: AxiosInstance, jwt: string): Promise<MenuRecord[]> {
  const response = await client.get<MenuCollectionResponse>(
    '/menus?populate=setors',
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  );

  if (!Array.isArray(response.data.data)) {
    throw new Error('O Strapi retornou uma coleção de menus inválida.');
  }

  return response.data.data.filter(isMenuRecord);
}
