export const SITUACAO_EXECUCAO_ADMIN = {
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CONCLUIDA_PARCIAL: 'concluida_parcial',
  CANCELADA: 'cancelada',
  INTERROMPIDA: 'interrompida',
} as const;

export type SituacaoExecucaoAdmin =
  (typeof SITUACAO_EXECUCAO_ADMIN)[keyof typeof SITUACAO_EXECUCAO_ADMIN];

export type FiltroSituacaoAdmin = SituacaoExecucaoAdmin | 'todas';
export type PeriodoPainelAdmin = 'hoje' | '7_dias' | '30_dias';

export interface DestinoExecucaoAdmin {
  codigo: number | null;
  nome: string;
  cidade: string;
  ordem: number | null;
  tipo: string;
}

export interface ExecucaoRotaAdmin {
  id: number | null;
  documentId: string | null;
  codigoSessao: string;
  username: string;
  setor: string;
  situacaoExecucao: SituacaoExecucaoAdmin;
  navegador: string;
  iniciadaEm: string;
  finalizadaEm: string | null;
  cidadeOrigem: string | null;
  destinos: DestinoExecucaoAdmin[];
  distanciaPlanejadaMetros: number | null;
  duracaoPlanejadaSegundos: number | null;
  distanciaPercorridaMetros: number | null;
  duracaoTotalSegundos: number | null;
  tempoMovimentoSegundos: number | null;
  tempoParadoSegundos: number | null;
  duracaoSemSinalSegundos: number | null;
  quantidadeDesvios: number | null;
  quantidadePontos: number | null;
  quantidadeDestinosPlanejados: number | null;
  quantidadeDestinosVisitados: number | null;
  rotaConfirmadaPorGps: boolean;
  teveInterrupcaoLocalizacao: boolean;
  quantidadeInterrupcoesLocalizacao: number | null;
  duracaoLocalizacaoIndisponivelSegundos: number | null;
  motivoFinalizacao: string | null;
  ultimaLocalizacaoEm: string | null;
  conclusaoConfirmadaEm: string | null;
  versaoAplicativo: string | null;
}

export interface MetricasPainelAdmin {
  totalExecucoes: number;
  emAndamento: number;
  concluidas: number;
  concluidasParcialmente: number;
  interrompidas: number;
  canceladas: number;
  confirmadasPorGps: number;
  comInterrupcaoLocalizacao: number;
  colaboradores: number;
  distanciaPercorridaMetros: number;
  duracaoTotalSegundos: number;
  destinosPlanejados: number;
  destinosVisitados: number;
  historicosConsolidados: number;
}

export interface PainelAdminPaginacao {
  pagina: number;
  tamanhoPagina: number;
  total: number;
  totalPaginas: number;
}

export interface PainelAdminRotas {
  periodo: {inicio: string; fim: string};
  escopo: {
    abrangencia: 'todos_setores' | 'proprio_setor';
    setor: string | null;
  };
  metricas: MetricasPainelAdmin;
  metricasLimitadas: boolean;
  execucoes: ExecucaoRotaAdmin[];
  paginacao: PainelAdminPaginacao;
}

/** Resposta paginada; métricas são omitidas pelo backend após a página 1. */
export interface PaginaPainelAdminRotas extends Omit<
  PainelAdminRotas,
  'metricas' | 'metricasLimitadas'
> {
  metricas: MetricasPainelAdmin | null;
  metricasLimitadas: boolean | null;
}
