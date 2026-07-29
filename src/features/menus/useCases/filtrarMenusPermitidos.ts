import type {AuthUser} from '../../../core/auth/AuthContext';
import type {MenuItem} from '../../../core/menu/Menu';
import type {MenuRecord} from '../models/MenuRecord';

const normalizeText = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? '';

const hasValidIdentity = (menu: MenuRecord): boolean =>
  normalizeText(menu.titulo).length > 0
  && normalizeText(menu.rota).length > 0;

/**
 * Aplica as regras de acesso aos registros do Strapi e devolve somente menus
 * ativos permitidos para o cargo e o setor do usuário autenticado.
 */
export function filtrarMenusPermitidos(records: MenuRecord[], user: AuthUser): MenuItem[] {
  const userSector = normalizeText(user.setor);
  const userRole = user.cargo?.trim().toUpperCase() ?? '';

  return records
    .filter(hasValidIdentity)
    .filter(menu => {
      // Um menu inativo fica indisponível para todos os perfis.
      if (menu.ativo !== true) return false;
      if (userRole === 'ADMIN') return true;

      const belongsToUserSector =
        userSector.length > 0
        && (
          menu.setors?.some(
          sector =>
            normalizeText(sector.titulo) === userSector,
          ) ?? false
        );

      const isAdminMenu = normalizeText(menu.titulo) === 'admin';

      if (userRole === 'GESTOR') {
        return belongsToUserSector || isAdminMenu;
      }

      return belongsToUserSector;
    })
    .map(menu => ({
      titulo: menu.titulo?.trim() ?? '',
      rota: menu.rota?.trim() ?? '',
      ativo: true,
      ordem:
        typeof menu.ordem === 'number'
        && Number.isFinite(menu.ordem)
          ? menu.ordem
          : 0,
      icone: menu.icone?.trim() || null,
    }));
}
