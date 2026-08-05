export const STATUS_EXECUCAO_ROTA = {
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CONCLUIDA_PARCIAL: 'concluida_parcial',
  CANCELADA: 'cancelada',
  INTERROMPIDA: 'interrompida',
} as const;

export type StatusExecucaoRota =
  (typeof STATUS_EXECUCAO_ROTA)[keyof typeof STATUS_EXECUCAO_ROTA];

export const MOTIVO_FINALIZACAO_ROTA = {
  CONCLUIDA_AUTOMATICAMENTE:
    'concluida_automaticamente',
  CANCELADA_ABERTURA_NAVEGADOR: 'cancelada_abertura_navegador',
  INTERROMPIDA_USUARIO: 'interrompida_usuario',
  INTERROMPIDA_LOGOUT: 'interrompida_logout',
  INTERROMPIDA_TROCA_DISPOSITIVO:
    'interrompida_troca_dispositivo',
  INTERROMPIDA_ERRO: 'interrompida_erro',
} as const;

export type MotivoFinalizacaoRota =
  (typeof MOTIVO_FINALIZACAO_ROTA)[keyof typeof MOTIVO_FINALIZACAO_ROTA];

export type NavegadorRota = 'google' | 'waze';

export type TipoDestinoRota =
  | 'loja'
  | 'restaurante'
  | 'posto_combustivel';

export interface CoordenadaRota {
  latitude: number;
  longitude: number;
}

export interface DestinoExecucaoRota extends CoordenadaRota {
  codigo: number;
  nome: string;
  cidade: string;
  ordem: number;
  tipo: TipoDestinoRota;
}

export type TipoOcorrenciaLocalizacao =
  | 'localizacao_desativada'
  | 'permissao_primeiro_plano_revogada'
  | 'permissao_segundo_plano_revogada';

export interface OcorrenciaLocalizacaoRota {
  id: number;
  tipo: TipoOcorrenciaLocalizacao;
  detectadaEm: string;
  normalizadaEm: string | null;
  duracaoSegundos: number | null;
}

export interface VisitaDestinoRota {
  codigo: number;
  ordemPlanejada: number;
  ordemVisita: number;
  confirmadoEm: string;
  latitudeConfirmacao: number;
  longitudeConfirmacao: number;
  distanciaConfirmacaoMetros: number;
}

export interface ResumoExecucaoRota {
  distanciaPercorridaMetros: number;
  duracaoTotalSegundos: number;
  tempoMovimentoSegundos: number;
  tempoParadoSegundos: number;
  duracaoSemSinalSegundos: number;
  quantidadeDesvios: number | null;
  quantidadePontos: number;
  quantidadeDestinosPlanejados: number;
  quantidadeDestinosVisitados: number;
  destinosVisitados: number[];
  ordemDestinosVisitados: number[];
  detalhesDestinosVisitados: VisitaDestinoRota[];
  chegadaDestinoFinalEm: string | null;
  conclusaoConfirmadaEm: string | null;
  duracaoAteDestinoFinalSegundos: number | null;
  destinosConfirmadosPorGps: boolean;
  rotaConfirmadaPorGps: boolean;
  teveInterrupcaoLocalizacao: boolean;
  quantidadeInterrupcoesLocalizacao: number;
  duracaoLocalizacaoIndisponivelSegundos: number;
  ocorrenciasLocalizacao: OcorrenciaLocalizacaoRota[];
  trajetoReal: string | null;
}

export interface ExecucaoRota {
  codigoSessao: string;
  sessaoDispositivoCodigo: string | null;
  ownerKey: string;
  usuarioId: number | null;
  usuarioDocumentId: string | null;
  username: string;
  setor: string;
  status: StatusExecucaoRota;
  navegador: NavegadorRota;
  iniciadaEm: string;
  finalizadaEm: string | null;
  cidadeOrigem: string | null;
  origem: CoordenadaRota;
  destinos: DestinoExecucaoRota[];
  trajetoPlanejado: string | null;
  distanciaPlanejadaMetros: number | null;
  duracaoPlanejadaSegundos: number | null;
  motivoFinalizacao: MotivoFinalizacaoRota | null;
  ultimaLocalizacaoEm: string | null;
  versaoAplicativo: string | null;
  servidorDocumentId: string | null;
  inicioSincronizado: boolean;
  finalizacaoSincronizada: boolean;
  resumo: ResumoExecucaoRota | null;
}

export interface PontoRastreamento extends CoordenadaRota {
  id: number;
  codigoSessao: string;
  sequencia: number;
  precisao: number | null;
  velocidade: number | null;
  direcao: number | null;
  registradoEm: string;
  sincronizado: boolean;
}

export interface NovoPontoRastreamento extends CoordenadaRota {
  precisao: number | null;
  velocidade: number | null;
  direcao: number | null;
  registradoEm: string;
}

export interface PlanejamentoExecucaoRota {
  servidorDocumentId: string | null;
  trajetoPlanejado: string | null;
  distanciaPlanejadaMetros: number | null;
  duracaoPlanejadaSegundos: number | null;
}
