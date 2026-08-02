/**
 * Rotas de menu incorporadas nesta versão do aplicativo.
 *
 * Este contrato fica separado do registro de componentes para que telas e
 * tipos de navegação não precisem importar o módulo que carrega todas as
 * screens, evitando dependências circulares.
 */
export const MENU_ROUTE_NAMES = [
  'Home',
  'MapaLojas',
  'Historico',
  'Pontos',
  'Patrimonio',
  'Chamados',
  'Contatos',
  'Admin',
] as const;

export type MenuRouteName = typeof MENU_ROUTE_NAMES[number];

const menuRouteNameSet = new Set<string>(MENU_ROUTE_NAMES);

/** Confirma se uma rota enviada pelo Strapi existe nesta versão do app. */
export function isMenuRouteName(route: string): route is MenuRouteName {
  return menuRouteNameSet.has(route);
}
