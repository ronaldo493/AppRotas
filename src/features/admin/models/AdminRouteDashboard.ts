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

export type FiltroResultadoViagemAdmin =
  | 'todas'
  | 'em_acompanhamento'
  | 'percorrida_confirmada'
  | 'percorrida_parcial'
  | 'interrompida'
  | 'evidencia_insuficiente'
  | 'nao_iniciada';

export interface FiltrosPainelAdmin {
  dataInicial: Date;
  dataFinal: Date;
  resultado: FiltroResultadoViagemAdmin;
  busca: string;
}

export type ResultadoViagemRotaAdmin =
  | 'em_acompanhamento'
  | 'percorrida_confirmada'
  | 'percorrida_parcial'
  | 'interrompida_com_trajeto'
  | 'interrompida_sem_trajeto'
  | 'trajeto_sem_visita_confirmada'
  | 'sem_evidencia_suficiente'
  | 'nao_iniciada';

export type StatusOperacionalRotaAdmin =
  | 'rastreando'
  | 'aguardando_dados'
  | 'sem_atualizacao'
  | 'sincronizacao_atrasada'
  | 'finalizacao_pendente'
  | 'concluida_integral'
  | 'concluida_com_interrupcao'
  | 'encerrada';

export type ConfiabilidadeRotaAdmin =
  | 'alta'
  | 'media'
  | 'baixa'
  | 'indeterminada';

export type AlertaOperacionalRotaAdmin =
  | 'destino_confirmado_finalizacao_pendente'
  | 'sem_atualizacao'
  | 'somente_ponto_inicial'
  | 'evidencia_insuficiente'
  | 'destino_nao_confirmado'
  | 'velocidade_incompativel'
  | 'sincronizacao_atrasada'
  | 'localizacao_interrompida';

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
  destinosConfirmadosPorGps?: boolean;
  rotaConfirmadaPorGps: boolean;
  teveInterrupcaoLocalizacao: boolean;
  quantidadeInterrupcoesLocalizacao: number | null;
  duracaoLocalizacaoIndisponivelSegundos: number | null;
  motivoFinalizacao: string | null;
  ultimaLocalizacaoEm: string | null;
  ultimaSincronizacaoEm?: string | null;
  atrasoUltimaSincronizacaoSegundos?: number | null;
  maiorAtrasoSincronizacaoSegundos?: number | null;
  origemFinalizacao?: string | null;
  conclusaoConfirmadaEm: string | null;
  versaoAplicativo: string | null;
  statusOperacional?: StatusOperacionalRotaAdmin;
  confiabilidade?: ConfiabilidadeRotaAdmin;
  alertasOperacionais?: AlertaOperacionalRotaAdmin[];
  atualizadaHaSegundos?: number | null;
  resultadoViagem?: ResultadoViagemRotaAdmin;
  velocidadeMediaKmH?: number | null;
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
  aguardandoDados?: number;
  semAtualizacao?: number;
  finalizacoesPendentes?: number;
  sincronizacoesAtrasadas?: number;
  confiabilidadeAlta?: number;
  confiabilidadeMedia?: number;
  confiabilidadeBaixa?: number;
  percursosConfirmados?: number;
  percursosParciais?: number;
  interrompidasComTrajeto?: number;
  interrompidasSemTrajeto?: number;
  trajetosSemVisitaConfirmada?: number;
  evidenciasInsuficientes?: number;
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
