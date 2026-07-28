export type CategoriaPonto =
  | 'Restaurante'
  | 'Posto de Combustível';

export interface PontoInteresse {
  id?: number;
  documentId?: string;
  latitude: string | number;
  longitude: string | number;
  descricao: string;
  categoria: CategoriaPonto;
  /*
   * Opcional na leitura para aceitar registros antigos.
   */
  usernameCriador?: string;
}

export interface NovoPonto {
  latitude: string;
  longitude: string;
  descricao: string;
  categoria: CategoriaPonto;
  usernameCriador: string;
}

export type NovoPontoInput =
  Omit<NovoPonto, 'usernameCriador'>;
