import {
  interpretarComandoVozRota,
  type ComandoVozRota,
} from './interpretarComandoVozRota';

interface ResultadoComandoVozRota {
  comando: ComandoVozRota;
  transcricao: string;
}

interface SegmentacaoCodigos {
  codigos: number[];
  tamanhos: number[];
}

/**
 * Prefere a menor quantidade de códigos e, em caso de empate, divisões mais
 * equilibradas. Assim, "2535" vira 25 e 35, em vez de 253 e 5.
 */
const escolherMelhorSegmentacao = (
  atual: SegmentacaoCodigos | null,
  candidata: SegmentacaoCodigos,
): SegmentacaoCodigos => {
  if (!atual) return candidata;

  if (candidata.codigos.length !== atual.codigos.length) {
    return candidata.codigos.length < atual.codigos.length ? candidata : atual;
  }

  const amplitude = (segmentacao: SegmentacaoCodigos): number =>
    Math.max(...segmentacao.tamanhos) - Math.min(...segmentacao.tamanhos);
  const amplitudeAtual = amplitude(atual);
  const amplitudeCandidata = amplitude(candidata);

  if (amplitudeCandidata !== amplitudeAtual) {
    return amplitudeCandidata < amplitudeAtual ? candidata : atual;
  }

  const codigosComUmDigito = (segmentacao: SegmentacaoCodigos): number =>
    segmentacao.tamanhos.filter(tamanho => tamanho === 1).length;

  return codigosComUmDigito(candidata) < codigosComUmDigito(atual)
    ? candidata
    : atual;
};

/**
 * Tenta reconstruir pausas removidas pelo reconhecimento usando apenas códigos
 * que realmente existem no catálogo de filiais.
 */
const segmentarCodigoConcatenado = (
  codigo: number,
  codigosValidos: ReadonlySet<number>,
  maiorQuantidadeDigitos: number,
): number[] | null => {
  const texto = String(codigo);

  if (texto.length <= maiorQuantidadeDigitos) return null;

  const memo = new Map<number, SegmentacaoCodigos | null>();

  const segmentarAPartirDe = (indice: number): SegmentacaoCodigos | null => {
    if (indice === texto.length) return {codigos: [], tamanhos: []};
    if (memo.has(indice)) return memo.get(indice) ?? null;

    let melhor: SegmentacaoCodigos | null = null;

    for (
      let tamanho = 1;
      tamanho <= maiorQuantidadeDigitos &&
      indice + tamanho <= texto.length;
      tamanho += 1
    ) {
      const trecho = texto.slice(indice, indice + tamanho);

      if (trecho.startsWith('0')) continue;

      const codigoCandidato = Number(trecho);
      if (!codigosValidos.has(codigoCandidato)) continue;

      const restante = segmentarAPartirDe(indice + tamanho);
      if (!restante) continue;

      melhor = escolherMelhorSegmentacao(melhor, {
        codigos: [codigoCandidato, ...restante.codigos],
        tamanhos: [tamanho, ...restante.tamanhos],
      });
    }

    memo.set(indice, melhor);
    return melhor;
  };

  return segmentarAPartirDe(0)?.codigos ?? null;
};

/**
 * Corrige somente valores impossíveis de serem um código único. Códigos válidos
 * ou ambiguidades curtas são preservados para evitar falsos positivos.
 */
export const normalizarCodigosReconhecidos = (
  codigos: readonly number[],
  codigosValidos: ReadonlySet<number>,
): number[] => {
  if (codigosValidos.size === 0) return [...codigos];

  const maiorQuantidadeDigitos = Math.max(
    ...Array.from(codigosValidos, codigo => String(codigo).length),
  );
  const codigosNormalizados = codigos.flatMap(codigo => {
    if (codigosValidos.has(codigo)) return [codigo];

    return (
      segmentarCodigoConcatenado(
        codigo,
        codigosValidos,
        maiorQuantidadeDigitos,
      ) ?? [codigo]
    );
  });

  return Array.from(new Set(codigosNormalizados));
};

/**
 * Normaliza listas de códigos sem misturar essa regra com o interpretador de
 * linguagem natural.
 */
const normalizarComando = (
  comando: ComandoVozRota,
  codigosValidos: ReadonlySet<number>,
): ComandoVozRota => {
  switch (comando.tipo) {
    case 'adicionar_filiais':
    case 'adicionar_e_tracar':
    case 'remover_filiais':
    case 'continuar_contexto':
      return {
        ...comando,
        codigos: normalizarCodigosReconhecidos(
          comando.codigos,
          codigosValidos,
        ),
      };
    default:
      return comando;
  }
};

/**
 * Pontua alternativas pela intenção reconhecida e pela quantidade de códigos
 * existentes, mantendo a ordem original como critério final de desempate.
 */
const pontuarComando = (
  comando: ComandoVozRota,
  codigosValidos: ReadonlySet<number>,
): number => {
  if (comando.tipo === 'nao_reconhecido') return -100;

  const codigos =
    'codigos' in comando
      ? comando.codigos
      : comando.tipo === 'substituir_filial'
        ? [comando.novoCodigo]
        : [];
  const codigosEncontrados = codigos.filter(codigo =>
    codigosValidos.has(codigo),
  ).length;
  const codigosAusentes = codigos.length - codigosEncontrados;

  return 100 + codigosEncontrados * 10 - codigosAusentes * 25;
};

/**
 * Escolhe a melhor alternativa devolvida pelo serviço de reconhecimento.
 */
export const selecionarComandoVozRota = (
  transcricoes: readonly string[],
  codigosValidos: ReadonlySet<number>,
): ResultadoComandoVozRota => {
  const alternativas = transcricoes
    .map(transcricao => transcricao.trim())
    .filter(Boolean);
  const primeiraTranscricao = alternativas[0] ?? '';
  let melhorResultado: ResultadoComandoVozRota = {
    comando: {tipo: 'nao_reconhecido'},
    transcricao: primeiraTranscricao,
  };
  let melhorPontuacao = -Infinity;

  alternativas.forEach(transcricao => {
    const comando = normalizarComando(
      interpretarComandoVozRota(transcricao),
      codigosValidos,
    );
    const pontuacao = pontuarComando(comando, codigosValidos);

    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorResultado = {comando, transcricao};
    }
  });

  return melhorResultado;
};
