export interface Chamado {
  id?: number;
  documentId?: string;
  sequencia: string | number;
  nomefilial: string;
  titulo: string;
  dataabertura: string;
  situacao: number;
  descricaosituacao?: string | null;
  descricao?: string | null;
  nomeabertura?: string | null;
  nomeresponsavel?: string | null;
  descricaosetorresponsavel?: string | null;
}
