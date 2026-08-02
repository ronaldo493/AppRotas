export interface Filial {
  codigofilial: number;
  nomefilial: string;
  nomecidade: string;
  uf?: string;
  endereco?: string;
  numero?: string | number;
  bairro?: string;
  telefone?: string;
  cnpj?: string;
  latitude?: string | number;
  longitude?: string | number;
  [key: string]: unknown;
}
