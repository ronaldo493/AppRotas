export interface MenuItem {
  titulo: string;
  rota: string;
  ativo: boolean;
  ordem: number;
  icone?: string | null;
}
