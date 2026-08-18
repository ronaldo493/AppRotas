export const ASSISTENTE_PROTOCOL_VERSION = 2 as const;

export type FonteAssistenteOrquestrador = 'BACKEND' | 'GEMINI' | 'FALLBACK';
export type DominioAssistenteOrquestrador =
  | 'filiais'
  | 'contatos'
  | 'pontos'
  | 'historico'
  | 'monitoramento_rotas'
  | 'ajuda_aplicativo'
  | 'sistema';
export type PeriodoAssistenteOrquestrador =
  | 'hoje'
  | 'ontem'
  | 'ultimos_7_dias'
  | 'mes_atual'
  | 'geral';
export type ResultadoRotaAssistenteOrquestrador =
  | 'todas'
  | 'em_acompanhamento'
  | 'percorrida_confirmada'
  | 'percorrida_parcial'
  | 'interrompida'
  | 'evidencia_insuficiente'
  | 'nao_iniciada';

export interface MemoriaAssistenteOrquestrador {
  ultimoDominio?: Exclude<DominioAssistenteOrquestrador, 'sistema'>;
  ultimaAcao?: string;
  ultimoCampo?: string;
  ultimoTermo?: string;
  ultimoColaborador?: string;
  ultimoColaboradorId?: number;
  ultimoPeriodo?: PeriodoAssistenteOrquestrador;
  ultimoResultadoRota?: ResultadoRotaAssistenteOrquestrador;
}

export interface BlocoAssistenteOrquestrador {
  tipo: 'metricas' | 'lista' | 'aviso';
  titulo?: string;
  itens: Array<{rotulo: string; valor?: string}>;
}

export interface RespostaAssistenteOrquestrador {
  protocolo: typeof ASSISTENTE_PROTOCOL_VERSION;
  processado: boolean;
  fonte: FonteAssistenteOrquestrador;
  dominio: DominioAssistenteOrquestrador;
  acao: string;
  texto: string;
  textoFalado: string;
  blocos: BlocoAssistenteOrquestrador[];
  sugestoes: string[];
  memoria: MemoriaAssistenteOrquestrador;
  precisaEsclarecimento: boolean;
  esclarecimento: string | null;
}
