import {
  ASSISTENTE_PROTOCOL_VERSION,
  type BlocoAssistenteOrquestrador,
  type DominioAssistenteOrquestrador,
  type MemoriaAssistenteOrquestrador,
  type RespostaAssistenteOrquestrador,
} from '../models/AssistenteOrquestrador';

const FONTES = ['BACKEND', 'GEMINI', 'FALLBACK'] as const;
const DOMINIOS: readonly DominioAssistenteOrquestrador[] = [
  'filiais', 'contatos', 'pontos', 'historico',
  'monitoramento_rotas', 'ajuda_aplicativo', 'sistema',
];
const PERIODOS = ['hoje', 'ontem', 'ultimos_7_dias', 'mes_atual', 'geral'] as const;
const RESULTADOS = [
  'todas', 'em_acompanhamento', 'percorrida_confirmada',
  'percorrida_parcial', 'interrompida', 'evidencia_insuficiente',
  'nao_iniciada',
] as const;

const textoSeguro = (valor: unknown, limite: number): string =>
  typeof valor === 'string'
    ? valor.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, limite)
    : '';

const pertence = <T extends string>(valor: unknown, lista: readonly T[]): valor is T =>
  typeof valor === 'string' && lista.includes(valor as T);

const validarMemoria = (valor: unknown): MemoriaAssistenteOrquestrador => {
  const item = valor && typeof valor === 'object' && !Array.isArray(valor)
    ? valor as Record<string, unknown>
    : {};
  return {
    ...(pertence(item.ultimoDominio, DOMINIOS.filter(dominio => dominio !== 'sistema'))
      ? {ultimoDominio: item.ultimoDominio as MemoriaAssistenteOrquestrador['ultimoDominio']}
      : {}),
    ...(textoSeguro(item.ultimoTermo, 100) ? {ultimoTermo: textoSeguro(item.ultimoTermo, 100)} : {}),
    ...(textoSeguro(item.ultimoColaborador, 100) ? {ultimoColaborador: textoSeguro(item.ultimoColaborador, 100)} : {}),
    ...(pertence(item.ultimoPeriodo, PERIODOS) ? {ultimoPeriodo: item.ultimoPeriodo} : {}),
    ...(pertence(item.ultimoResultadoRota, RESULTADOS) ? {ultimoResultadoRota: item.ultimoResultadoRota} : {}),
  };
};

const validarBlocos = (valor: unknown): BlocoAssistenteOrquestrador[] => {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0, 4).flatMap(bloco => {
    if (!bloco || typeof bloco !== 'object' || Array.isArray(bloco)) return [];
    const item = bloco as Record<string, unknown>;
    if (!pertence(item.tipo, ['metricas', 'lista', 'aviso'] as const)) return [];
    const itens = Array.isArray(item.itens)
      ? item.itens.slice(0, 20).flatMap(valorItem => {
          if (!valorItem || typeof valorItem !== 'object' || Array.isArray(valorItem)) return [];
          const registro = valorItem as Record<string, unknown>;
          const rotulo = textoSeguro(registro.rotulo, 140);
          const valor = textoSeguro(registro.valor, 220);
          return rotulo ? [{rotulo, ...(valor ? {valor} : {})}] : [];
        })
      : [];
    return [{
      tipo: item.tipo,
      ...(textoSeguro(item.titulo, 100) ? {titulo: textoSeguro(item.titulo, 100)} : {}),
      itens,
    }];
  });
};

/** Reconstrói a resposta; nenhuma ação arbitrária recebida é executada. */
export const validarRespostaAssistenteOrquestrador = (
  valor: unknown,
): RespostaAssistenteOrquestrador | null => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null;
  const item = valor as Record<string, unknown>;
  if (
    item.protocolo !== ASSISTENTE_PROTOCOL_VERSION ||
    typeof item.processado !== 'boolean' ||
    !pertence(item.fonte, FONTES) ||
    !pertence(item.dominio, DOMINIOS) ||
    typeof item.precisaEsclarecimento !== 'boolean'
  ) return null;
  const acao = textoSeguro(item.acao, 80);
  const texto = textoSeguro(item.texto, 4_000);
  const textoFalado = textoSeguro(item.textoFalado, 1_000);
  const esclarecimento = textoSeguro(item.esclarecimento, 500);
  if (!acao || (item.processado && !texto && !esclarecimento)) return null;

  return {
    protocolo: ASSISTENTE_PROTOCOL_VERSION,
    processado: item.processado,
    fonte: item.fonte,
    dominio: item.dominio,
    acao,
    texto,
    textoFalado,
    blocos: validarBlocos(item.blocos),
    sugestoes: Array.isArray(item.sugestoes)
      ? item.sugestoes.slice(0, 8).map(sugestao => textoSeguro(sugestao, 160)).filter(Boolean)
      : [],
    memoria: validarMemoria(item.memoria),
    precisaEsclarecimento: item.precisaEsclarecimento,
    esclarecimento: esclarecimento || null,
  };
};
