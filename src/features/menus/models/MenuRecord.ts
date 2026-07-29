export interface MenuSectorRecord {
  titulo?: string | null;
}

export interface MenuRecord {
  titulo?: string | null;
  rota?: string | null;
  ativo?: boolean | null;
  ordem?: number | null;
  icone?: string | null;
  setors?: MenuSectorRecord[] | null;
}
