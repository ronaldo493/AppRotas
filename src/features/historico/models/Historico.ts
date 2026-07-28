export const TIPO_HISTORICO = {
  LOJA: 'loja',
  RESTAURANTE: 'restaurante',
  POSTO_COMBUSTIVEL: 'posto_combustivel',
} as const;

export type TipoHistorico =
  (typeof TIPO_HISTORICO)[keyof typeof TIPO_HISTORICO];

export interface HistoricoRotaItem {
  codigofilial: number;
  nomefilial: string;
  nomecidade: string;
  ordem: number;
}

export interface HistoricoVisita {
  id: number;
  documentId?: string;
  datahora: string;
  username: string;
  setor: string;
  cidadeOrigem?: string;
  rotas: HistoricoRotaItem[];
  /*
   * Opcional na leitura para manter compatibilidade com
   * históricos criados antes da inclusão desse campo.
   */
  tipoHistorico?: TipoHistorico;
  createdAt?: string;
  updatedAt?: string;
}

export type NovoHistoricoVisita = Omit<
  HistoricoVisita,
  'id' | 'documentId' | 'createdAt' | 'updatedAt'
>;

export interface NovoHistoricoRota {
  datahora: string;
  username: string;
  setor: string;
  cidadeOrigem?: string;
  tipoHistorico: TipoHistorico;
  rotas: HistoricoRotaItem[];
}

export interface FiltroHistoricoRota {
  dataInicial?: Date;
  dataFinal?: Date;
}
