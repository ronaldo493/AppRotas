interface ComandoComCodigos {
  codigos: number[];
}

export type ReferenciaFilialVoz =
  | {tipo: 'codigo'; codigo: number}
  | {tipo: 'ultima_mencionada'}
  | {tipo: 'ultima_rota'};

export type ComandoVozRota =
  | ({tipo: 'adicionar_filiais'} & ComandoComCodigos)
  | ({tipo: 'adicionar_e_tracar'} & ComandoComCodigos)
  | ({tipo: 'remover_filiais'} & ComandoComCodigos)
  | ({tipo: 'continuar_contexto'} & ComandoComCodigos)
  | {
      tipo: 'mover_filial';
      alvo: ReferenciaFilialVoz;
      destino: 'inicio' | 'fim' | 'posicao';
      posicao?: number;
    }
  | {
      tipo: 'mover_filial_relativa';
      alvo: ReferenciaFilialVoz;
      referencia: ReferenciaFilialVoz;
      relacao: 'antes' | 'depois';
    }
  | {
      tipo: 'substituir_filial';
      alvo: ReferenciaFilialVoz;
      novoCodigo: number;
    }
  | {tipo: 'remover_referencia'; alvo: ReferenciaFilialVoz}
  | {tipo: 'inverter_rota'}
  | {tipo: 'desfazer'}
  | {tipo: 'tracar_rota'}
  | {tipo: 'consultar_rota'}
  | {tipo: 'limpar_rota'}
  | {tipo: 'confirmar'}
  | {tipo: 'cancelar'}
  | {tipo: 'ajuda'}
  | {tipo: 'nao_reconhecido'};

const NUMEROS_SIMPLES: Readonly<Record<string, number>> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezassete: 17,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
};

const ACAO_ADICIONAR =
  /\b(adiciona|adicionar|adicione|coloca|colocar|coloque|inclui|incluir|inclua|ir|leva|levar|leve|passe|passar|preciso|quero|vamos|visitar|visite|vou)\b/;
const ACAO_REMOVER =
  /\b(apaga|apagar|desiste|desisti|desistir|exclua|exclui|excluir|remova|remove|remover|retira|retire|retirar|tira|tire|tirar)\b|\bnao quero mais\b/;
const ACAO_MOVER =
  /\b(coloca|colocar|coloque|joga|jogar|jogue|move|mover|mova|passa|passar|passe|poe|ponha|posiciona|posicionar|posicione)\b/;
const ACAO_SUBSTITUIR =
  /\b(altera|alterar|muda|mudar|mude|substitua|substituir|troca|trocar|troque)\b/;
const ACAO_TRACAR =
  /\b(traca|tracar|trace)\b|\b(abre|abrir|calcula|calcular|comece|comeca|comecar|cria|criar|crie|faz|fazer|faca|finaliza|finalizar|inicia|iniciar|monta|montar|monte)\b.*\b(navegacao|rota|rotas)\b/;
const CONTEXTO_FILIAL =
  /\b(filial|filiais|loja|lojas|numero|numeros|parada|paradas|rota|rotas)\b/;

/**
 * Normaliza acentos, maiúsculas e pontuação antes de interpretar o comando.
 */
const normalizarTexto = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Converte um número falado em português para seu valor numérico.
 */
const converterNumeroPorExtenso = (tokens: readonly string[]): number | null => {
  if (tokens.length === 0) return null;

  let total = 0;
  let parcial = 0;
  let encontrouNumero = false;

  for (const token of tokens) {
    if (token === 'e') continue;

    if (token === 'mil') {
      total += (parcial || 1) * 1000;
      parcial = 0;
      encontrouNumero = true;
      continue;
    }

    const valor = NUMEROS_SIMPLES[token];

    if (valor === undefined) return null;

    parcial += valor;
    encontrouNumero = true;
  }

  return encontrouNumero ? total + parcial : null;
};

/**
 * Separa sequências como "doze e trinta e cinco" em 12 e 35, preservando o
 * "e" interno de números como "trinta e cinco".
 */
const separarNumerosPorExtenso = (tokens: readonly string[]): string[][] => {
  const grupos: string[][] = [[]];

  tokens.forEach((token, index) => {
    const grupoAtual = grupos[grupos.length - 1];

    if (token !== 'e') {
      grupoAtual.push(token);
      return;
    }

    const proximoToken = tokens[index + 1];
    const valorAtual = converterNumeroPorExtenso(grupoAtual);
    const valorProximo =
      proximoToken === 'mil' ? 1000 : NUMEROS_SIMPLES[proximoToken];

    if (
      valorAtual !== null &&
      valorProximo !== undefined &&
      valorProximo >= valorAtual
    ) {
      grupos.push([]);
      return;
    }

    grupoAtual.push(token);
  });

  return grupos.filter(grupo => grupo.length > 0);
};

/**
 * Extrai códigos em algarismos ou por extenso, preservando a ordem falada.
 */
const extrairCodigos = (texto: string): number[] => {
  const algarismos = texto.match(/\d+/g);

  if (algarismos) {
    return Array.from(
      new Set(
        algarismos
          .map(Number)
          .filter(codigo => Number.isSafeInteger(codigo) && codigo >= 0),
      ),
    );
  }

  const tokensNumericos = texto
    .split(' ')
    .filter(
      token =>
        token === 'e' ||
        token === 'mil' ||
        NUMEROS_SIMPLES[token] !== undefined,
    );

  if (
    tokensNumericos.length > 1 &&
    tokensNumericos.every(
      token =>
        NUMEROS_SIMPLES[token] !== undefined &&
        NUMEROS_SIMPLES[token] <= 9,
    )
  ) {
    return [
      Number(tokensNumericos.map(token => NUMEROS_SIMPLES[token]).join('')),
    ];
  }

  return Array.from(
    new Set(
      separarNumerosPorExtenso(tokensNumericos)
        .map(converterNumeroPorExtenso)
        .filter(
          (codigo): codigo is number =>
            codigo !== null &&
            Number.isSafeInteger(codigo) &&
            codigo >= 0,
        ),
    ),
  );
};

/**
 * Identifica uma filial explícita ou uma referência à conversa/rota atual.
 */
const criarReferencia = (trecho: string): ReferenciaFilialVoz | null => {
  const codigos = extrairCodigos(trecho);

  if (codigos.length > 0) {
    return {tipo: 'codigo', codigo: codigos[0]};
  }

  if (/\b(ultima|ultimo|final)\b/.test(trecho)) {
    return {tipo: 'ultima_rota'};
  }

  if (/\b(ela|ele|essa|esse|a mesma|o mesmo)\b/.test(trecho)) {
    return {tipo: 'ultima_mencionada'};
  }

  return null;
};

/**
 * Interpreta uma troca como "troque a 35 pela 42" ou "troque ela pela 42".
 */
const interpretarSubstituicao = (texto: string): ComandoVozRota | null => {
  if (!ACAO_SUBSTITUIR.test(texto)) return null;

  const partes = texto.split(/\b(?:por|pela|pelo)\b/);
  if (partes.length < 2) return null;

  const alvo = criarReferencia(partes[0]);
  const novoCodigo = extrairCodigos(partes.slice(1).join(' '))[0];

  if (!alvo || novoCodigo === undefined) return null;

  return {tipo: 'substituir_filial', alvo, novoCodigo};
};

/**
 * Interpreta posições relativas como "coloque a 35 antes da 12".
 */
const interpretarMovimentoRelativo = (
  texto: string,
): ComandoVozRota | null => {
  if (!ACAO_MOVER.test(texto)) return null;

  const correspondencia = texto.match(
    /\b(antes|depois)\b|\bna frente (?:da|de)\b|\batras (?:da|de)\b/,
  );
  if (!correspondencia || correspondencia.index === undefined) return null;

  const relacao =
    correspondencia[0] === 'antes' ||
    correspondencia[0].startsWith('na frente')
      ? 'antes'
      : 'depois';
  const alvo = criarReferencia(texto.slice(0, correspondencia.index));
  const referencia = criarReferencia(
    texto.slice(correspondencia.index + correspondencia[0].length),
  );

  if (!alvo || !referencia) return null;

  return {tipo: 'mover_filial_relativa', alvo, referencia, relacao};
};

/**
 * Interpreta movimentos para o início, fim ou uma posição numérica.
 */
const interpretarMovimentoAbsoluto = (
  texto: string,
): ComandoVozRota | null => {
  if (!ACAO_MOVER.test(texto)) return null;

  const marcadorPosicao = texto.match(
    /\b(?:na|para a|pra|para)\s+posicao\s+(.+)$/,
  );

  if (marcadorPosicao?.index !== undefined) {
    const alvo = criarReferencia(texto.slice(0, marcadorPosicao.index));
    const posicao = extrairCodigos(marcadorPosicao[1])[0];

    if (alvo && posicao !== undefined) {
      return {tipo: 'mover_filial', alvo, destino: 'posicao', posicao};
    }
  }

  const destinoInicio =
    /\b(?:para|pro|pra|no|na)\s+(inicio|comeco|primeira posicao)\b|\b(?:como|em|por)\s+(primeiro|primeira)(?:\s+(lugar|parada))?\b/;
  const destinoFim =
    /\b(?:para|pro|pra|no|na)\s+(fim|final|ultima posicao)\b|\b(?:como|em|por)\s+(ultimo|ultima)(?:\s+(lugar|parada))?\b/;
  const destino = destinoInicio.test(texto)
    ? 'inicio'
    : destinoFim.test(texto)
      ? 'fim'
      : null;

  if (!destino) return null;

  const marcadorDestino = texto.search(
    destino === 'inicio' ? destinoInicio : destinoFim,
  );
  const alvo = criarReferencia(
    marcadorDestino >= 0 ? texto.slice(0, marcadorDestino) : texto,
  );

  return alvo ? {tipo: 'mover_filial', alvo, destino} : null;
};

/**
 * Interpreta linguagem natural localmente, sem enviar a fala ou a rota para IA.
 */
export const interpretarComandoVozRota = (transcricao: string): ComandoVozRota => {
  const texto = normalizarTexto(transcricao);

  if (!texto) return {tipo: 'nao_reconhecido'};

  if (
    /^(confirma|confirmar|confirmo|pode|pode fazer|pode limpar|sim)$/.test(
      texto,
    )
  ) {
    return {tipo: 'confirmar'};
  }

  if (
    /^(cancela|cancelar|cancelo|deixa|deixa pra la|deixe|deixe pra la|nao)( isso| essa acao)?$/.test(
      texto,
    )
  ) {
    return {tipo: 'cancelar'};
  }

  if (
    /\b(desfaz|desfazer|desfaca)\b/.test(texto) ||
    /\b(reverte|reverter|reverta|volta|voltar|volte)\b.*\b(ultimo|ultima)\b/.test(texto)
  ) {
    return {tipo: 'desfazer'};
  }

  if (
    /\b(inverte|inverter|inverta)\b.*\b(rota|ordem|paradas)\b/.test(texto) ||
    /\b(ordem|rota)\b.*\b(contraria|contrario|inversa|inverso)\b/.test(texto)
  ) {
    return {tipo: 'inverter_rota'};
  }

  if (
    /\b(limpa|limpar|apaga|apagar|apague|zera|zerar)\b.*\b(rota|rotas|lista|paradas)\b/.test(texto) ||
    /\b(comecar|comeca)\b.*\b(novo|nova|zero)\b/.test(texto)
  ) {
    return {tipo: 'limpar_rota'};
  }

  if (
    /\b(ajuda|comandos|opcoes)\b/.test(texto) ||
    /\b(o que|como)\b.*\b(dizer|falar|pedir)\b/.test(texto)
  ) {
    return {tipo: 'ajuda'};
  }

  if (
    /\b(quantas|quais|como esta|mostra|mostrar|consulta|consultar|ler|leia)\b.*\b(filiais|lojas|paradas|rota)\b/.test(texto) ||
    /\b(o que tem|quero saber)\b.*\b(rota|paradas)\b/.test(texto) ||
    /^(minha rota|minhas paradas|rota atual)$/.test(texto)
  ) {
    return {tipo: 'consultar_rota'};
  }

  const substituicao = interpretarSubstituicao(texto);
  if (substituicao) return substituicao;

  const movimentoRelativo = interpretarMovimentoRelativo(texto);
  if (movimentoRelativo) return movimentoRelativo;

  const movimentoAbsoluto = interpretarMovimentoAbsoluto(texto);
  if (movimentoAbsoluto) return movimentoAbsoluto;

  if (ACAO_REMOVER.test(texto)) {
    const alvo = criarReferencia(texto);
    const codigos = extrairCodigos(texto);

    if (codigos.length > 0) return {tipo: 'remover_filiais', codigos};
    if (alvo) return {tipo: 'remover_referencia', alvo};
  }

  const codigos = extrairCodigos(texto);

  if (ACAO_TRACAR.test(texto)) {
    return codigos.length > 0
      ? {tipo: 'adicionar_e_tracar', codigos}
      : {tipo: 'tracar_rota'};
  }

  if (
    codigos.length > 0 &&
    /^(agora|depois|tambem|e)\b/.test(texto)
  ) {
    return {tipo: 'continuar_contexto', codigos};
  }

  const somenteNumero =
    /^\d+(\s+\d+)*$/.test(texto) ||
    texto
      .split(' ')
      .every(
        token =>
          token === 'e' ||
          token === 'mil' ||
          NUMEROS_SIMPLES[token] !== undefined,
      );

  if (
    codigos.length > 0 &&
    (ACAO_ADICIONAR.test(texto) || CONTEXTO_FILIAL.test(texto) || somenteNumero)
  ) {
    return {tipo: 'adicionar_filiais', codigos};
  }

  return {tipo: 'nao_reconhecido'};
};
