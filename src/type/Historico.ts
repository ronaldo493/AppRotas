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
  rotas: HistoricoRotaItem[];
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
  rotas: HistoricoRotaItem[];
}

export interface FiltroHistoricoRota {
  dataInicial?: Date;
  dataFinal?: Date;
}
