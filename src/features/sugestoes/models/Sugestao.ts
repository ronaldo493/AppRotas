export type SugestaoTipo =
  | 'SUGESTAO'
  | 'MELHORIA'
  | 'PROBLEMA';

export type SugestaoStatus =
  | 'PENDENTE'
  | 'ANALISANDO'
  | 'CONCLUIDO';

export interface NovaSugestao {
  user: string;
  setor?: string;
  email?: string;
  tipo: SugestaoTipo;
  tela: string;
  sugestao: string;
  situation: SugestaoStatus;
}

export interface Sugestao extends NovaSugestao {
  id: number;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}
