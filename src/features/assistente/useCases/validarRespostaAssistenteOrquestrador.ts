import {
  ASSISTENTE_PROTOCOL_VERSION,
  type BlocoAssistenteOrquestrador,
  type DominioAssistenteOrquestrador,
  type EsclarecimentoPendenteAssistenteOrquestrador,
  type MemoriaAssistenteOrquestrador,
  type RespostaAssistenteOrquestrador,
} from '../models/AssistenteOrquestrador';

const FONTES = ['BACKEND', 'GEMINI', 'FALLBACK'] as const;
const DOMINIOS: readonly DominioAssistenteOrquestrador[] = [
  'filiais', 'contatos', 'pontos', 'historico',
  'monitoramento_rotas', 'ajuda_aplicativo', 'sistema',
];
const PERIODOS = ['hoje', 'ontem', 'ultimos_7_dias', 'ultimos_30_dias', 'mes_atual', 'geral'] as const;
const RESULTADOS = [
  'todas', 'em_acompanhamento', 'percorrida_confirmada',
  'percorrida_parcial', 'interrompida', 'evidencia_insuficiente',
  'nao_iniciada',
] as const;
const RESULTADOS_NEGOCIO = [
  'ENCONTRADO',
  'SEM_RESULTADO',
  'AMBIGUO',
  'NAO_COMPREENDIDO',
] as const;

const textoSeguro = (valor: unknown, limite: number): string =>
  typeof valor === 'string'
    ? valor.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, limite)
    : '';

const pertence = <T extends string>(valor: unknown, lista: readonly T[]): valor is T =>
  typeof valor === 'string' && lista.includes(valor as T);

const validarEsclarecimentoPendente = (
  valor: unknown,
): EsclarecimentoPendenteAssistenteOrquestrador | undefined => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return undefined;
  const item = valor as Record<string, unknown>;
  if (
    !pertence(item.ferramenta, DOMINIOS.filter(dominio => dominio !== 'sistema')) ||
    !pertence(item.parametro, ['termo', 'termoComparacao'] as const)
  ) return undefined;
  const acao = textoSeguro(item.acao, 50);
  if (!acao) return undefined;
  const parametrosRecebidos = item.parametros &&
    typeof item.parametros === 'object' &&
    !Array.isArray(item.parametros)
    ? item.parametros as Record<string, unknown>
    : {};
  const opcoes = Array.isArray(item.opcoes)
    ? item.opcoes.slice(0, 8).flatMap(opcao => {
        if (!opcao || typeof opcao !== 'object' || Array.isArray(opcao)) return [];
        const registro = opcao as Record<string, unknown>;
        const valorOpcao = textoSeguro(registro.valor, 100);
        const rotulo = textoSeguro(registro.rotulo, 140);
        return valorOpcao && rotulo ? [{valor: valorOpcao, rotulo}] : [];
      })
    : [];
  if (opcoes.length < 2) return undefined;
  const quantidade = Number(parametrosRecebidos.quantidade);
  return {
    ferramenta: item.ferramenta as EsclarecimentoPendenteAssistenteOrquestrador['ferramenta'],
    acao,
    parametro: item.parametro,
    parametros: {
      ...(textoSeguro(parametrosRecebidos.termo, 100)
        ? {termo: textoSeguro(parametrosRecebidos.termo, 100)}
        : {}),
      ...(textoSeguro(parametrosRecebidos.termoComparacao, 100)
        ? {termoComparacao: textoSeguro(parametrosRecebidos.termoComparacao, 100)}
        : {}),
      ...(textoSeguro(parametrosRecebidos.campo, 40)
        ? {campo: textoSeguro(parametrosRecebidos.campo, 40)}
        : {}),
      ...(pertence(parametrosRecebidos.periodo, PERIODOS)
        ? {periodo: parametrosRecebidos.periodo}
        : {}),
      ...(pertence(parametrosRecebidos.resultado, RESULTADOS)
        ? {resultado: parametrosRecebidos.resultado}
        : {}),
      ...(Number.isInteger(quantidade) && quantidade >= 1 && quantidade <= 10
        ? {quantidade}
        : {}),
    },
    opcoes,
  };
};

const validarMemoria = (valor: unknown): MemoriaAssistenteOrquestrador => {
  const item = valor && typeof valor === 'object' && !Array.isArray(valor)
    ? valor as Record<string, unknown>
    : {};
  const esclarecimentoPendente = validarEsclarecimentoPendente(
    item.esclarecimentoPendente,
  );
  return {
    ...(pertence(item.ultimoDominio, DOMINIOS.filter(dominio => dominio !== 'sistema'))
      ? {ultimoDominio: item.ultimoDominio as MemoriaAssistenteOrquestrador['ultimoDominio']}
      : {}),
    ...(textoSeguro(item.ultimaAcao, 50) ? {ultimaAcao: textoSeguro(item.ultimaAcao, 50)} : {}),
    ...(textoSeguro(item.ultimoCampo, 40) ? {ultimoCampo: textoSeguro(item.ultimoCampo, 40)} : {}),
    ...(textoSeguro(item.ultimoTermo, 100) ? {ultimoTermo: textoSeguro(item.ultimoTermo, 100)} : {}),
    ...(textoSeguro(item.ultimoColaborador, 100) ? {ultimoColaborador: textoSeguro(item.ultimoColaborador, 100)} : {}),
    ...(Number.isInteger(Number(item.ultimoColaboradorId)) && Number(item.ultimoColaboradorId) > 0
      ? {ultimoColaboradorId: Number(item.ultimoColaboradorId)}
      : {}),
    ...(textoSeguro(item.ultimoColaboradorComparacao, 100)
      ? {ultimoColaboradorComparacao: textoSeguro(item.ultimoColaboradorComparacao, 100)}
      : {}),
    ...(Number.isInteger(Number(item.ultimoColaboradorComparacaoId)) &&
      Number(item.ultimoColaboradorComparacaoId) > 0
      ? {ultimoColaboradorComparacaoId: Number(item.ultimoColaboradorComparacaoId)}
      : {}),
    ...(pertence(item.ultimoPeriodo, PERIODOS) ? {ultimoPeriodo: item.ultimoPeriodo} : {}),
    ...(pertence(item.ultimoResultadoRota, RESULTADOS) ? {ultimoResultadoRota: item.ultimoResultadoRota} : {}),
    ...(esclarecimentoPendente ? {esclarecimentoPendente} : {}),
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
    resultadoNegocio: pertence(item.resultadoNegocio, RESULTADOS_NEGOCIO)
      ? item.resultadoNegocio
      : item.precisaEsclarecimento
        ? 'AMBIGUO'
        : item.processado
          ? 'ENCONTRADO'
          : 'NAO_COMPREENDIDO',
  };
};
