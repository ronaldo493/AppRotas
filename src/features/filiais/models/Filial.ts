export interface Filial {
  codigofilial: number;
  nomefilial: string;
  nomecidade: string;
  uf?: string;
  endereco?: string;
  numero?: string | number;
  cep?: string;
  bairro?: string;
  telefone?: string;
  gerente?: string;
  supervisor?: string;
  cnpj?: string;
  horariofuncionamento?: string;
  numeroibge?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  [key: string]: unknown;
}
