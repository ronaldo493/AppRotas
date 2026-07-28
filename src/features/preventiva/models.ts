export type TipoServico =
  | 'PREVENTIVA'
  | 'MONTAGEM'
  | 'INCLUSÃO'
  | 'REFORMA'
  | 'TROCA';

export type TipoSecao =
  | 'CAIXA'
  | 'BALCAO'
  | 'SERVIDOR'
  | 'GERENTE'
  | 'CLINICA'
  | 'RACK';

export interface OpcaoEquipamento {
  label: string;
  value: string;
}

export interface Equipamento {
  label: string;
  options?: OpcaoEquipamento[];
  requiresSelection: boolean;
}

export interface EquipamentoSelecionado
  extends Equipamento {
  section: string;
}

export interface SecaoPatrimonio {
  title: string;
  items: Equipamento[];
}

export interface RelatorioPatrimonio {
  categoria: TipoServico;
  filial: string;
  secoes: Record<
    string,
    Record<string, string>
  >;
}
