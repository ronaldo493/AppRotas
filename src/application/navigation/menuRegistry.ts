import type {ComponentType} from 'react';

import type {MenuItem} from '../../core/menu/Menu';
import AdminScreen from '../../features/admin/AdminScreen';
import ChamadosScreen from '../../features/chamados/ChamadosScreen';
import ContatosScreen from '../../features/contatos/screens/ContatosScreen';
import MapaFiliaisScreen from '../../features/filiais/screens/MapaFiliaisScreen';
import HistoricoScreen from '../../features/historico/screens/HistoricoScreen';
import PontosScreen from '../../features/pontos/screens/PontosScreen';
import PatrimonioEntryScreen from '../../features/patrimonio/screens/PatrimonioEntryScreen';
import RotasScreen from '../../features/rotas/screens/RotasScreen';
import {
  isMenuRouteName,
  type MenuRouteName,
} from './menuRouteNames';

export {
  isMenuRouteName,
  type MenuRouteName,
} from './menuRouteNames';

/**
 * Mantém a relação entre a rota técnica cadastrada no Strapi e a tela
 * disponível nesta versão do aplicativo.
 */
export const menuScreenRegistry = {
  Home: RotasScreen,
  MapaLojas: MapaFiliaisScreen,
  Historico: HistoricoScreen,
  Pontos: PontosScreen,
  Patrimonio: PatrimonioEntryScreen,
  Chamados: ChamadosScreen,
  Contatos: ContatosScreen,
  Admin: AdminScreen,
} satisfies Record<MenuRouteName, ComponentType<object>>;

export interface NavigableMenu extends Omit<MenuItem, 'rota'> {rota: MenuRouteName}

interface MenuNavigationResolution {
  menus: NavigableMenu[];
  unsupportedRoutes: string[];
}

/**
 * Prepara os menus para a navegação: remove inativos, ordena, descarta rotas
 * desconhecidas e impede que a mesma tela seja registrada mais de uma vez.
 */
export function resolveMenuNavigation(menuItems: MenuItem[]): MenuNavigationResolution {
  const registeredRoutes = new Set<MenuRouteName>();
  const unsupportedRoutes = new Set<string>();
  const menus: NavigableMenu[] = [];

  const orderedItems = [...menuItems]
    .filter(menu => menu.ativo)
    .sort(
      (first, second) =>
        first.ordem - second.ordem
        || first.titulo.localeCompare(second.titulo),
    );

  orderedItems.forEach(menu => {
    if (!isMenuRouteName(menu.rota)) {
      unsupportedRoutes.add(menu.rota);
      return;
    }

    // Uma rota técnica pode aparecer somente uma vez no navegador.
    if (registeredRoutes.has(menu.rota)) return;

    registeredRoutes.add(menu.rota);
    menus.push({
      ...menu,
      rota: menu.rota,
    });
  });

  return {
    menus,
    unsupportedRoutes: [...unsupportedRoutes],
  };
}
