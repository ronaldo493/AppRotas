export interface Filial {
  codigofilial: number;
  nomefilial: string;
  nomecidade: string;
  endereco?: string;
  numero?: string | number;
  bairro?: string;
  telefone?: string;
  cnpj?: string;
  [key: string]: unknown;
}