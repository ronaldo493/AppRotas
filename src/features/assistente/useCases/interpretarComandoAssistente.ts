import {TIPO_HISTORICO} from '../../historico/models/Historico';
import type {
  ComandoAssistente,
  ContextoInterpretacaoAssistente,
  DestinoAssistente,
  ResultadoInterpretacaoAssistente,
  TopicoAjudaAssistente,
} from '../models/ComandoAssistente';

interface ContextoInterpretacao {
  texto: string;
  conversa: ContextoInterpretacaoAssistente;
}

interface NoIntencao {
  id: string;
  interpretar?: (contexto: ContextoInterpretacao) => ComandoAssistente | null;
  filhos?: readonly NoIntencao[];
}

const normalizarTexto = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const contem = (texto: string, expressao: RegExp): boolean =>
  expressao.test(texto);

const interpretarConfirmacao = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (/^(sim|confirmar|confirma|confirmo|pode|pode abrir|pode tracar)$/.test(texto)) {
    return {dominio: 'sistema', acao: 'confirmar'};
  }

  if (/^(nao|cancelar|cancela|cancelo|deixa|deixe|deixa pra la|deixe pra la)$/.test(texto)) {
    return {dominio: 'sistema', acao: 'cancelar'};
  }

  return null;
};

const interpretarAjuda = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null =>
  contem(
    texto,
    /\b(ajuda|comandos|opcoes|funcionalidades)\b|\b(o que|como|quais coisas)\b.*\b(voce|vc|assistente)\b.*\b(faz|fazer|pode|ajuda|ajudar|serve)\b|\b(do que)\b.*\b(voce|vc|assistente)\b.*\b(capaz)\b|\b(mostre|mostrar)\b.*\b(suas funcoes|seus recursos)\b/,
  )
    ? {dominio: 'sistema', acao: 'ajuda'}
    : null;

const TOPICOS_AJUDA: ReadonlyArray<{
  topico: TopicoAjudaAssistente;
  termos: RegExp;
}> = [
  {topico: 'rotas', termos: /\b(rota|rotas|filial|filiais|loja|lojas)\b/},
  {topico: 'pontos', termos: /\b(ponto|pontos|restaurante|posto|combustivel)\b/},
  {topico: 'contatos', termos: /\b(contato|contatos|ramal|ddr)\b/},
  {topico: 'historico', termos: /\b(historico|visitas realizadas)\b/},
  {topico: 'chamados', termos: /\b(chamado|chamados)\b/},
  {topico: 'preventiva', termos: /\b(preventiva|patrimonio|equipamento)\b/},
  {topico: 'perfil', termos: /\b(perfil|cadastro|email|senha)\b/},
];

const interpretarOrientacao = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (
    !/\b(como|onde|me ensina|me explique|me explica|o que fazer)\b/.test(
      texto,
    )
  ) {
    return null;
  }

  const topico = TOPICOS_AJUDA.find(item => item.termos.test(texto))?.topico;

  return topico
    ? {dominio: 'sistema', acao: 'orientar', topico}
    : null;
};

const interpretarContexto = ({
  texto,
  conversa,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (
    conversa.possuiUltimoPonto &&
    (
      /\b(me leve|navegar|navegue|tracar|trace|abrir|abra)\b.*\b(ate la|pra la|para la|ele|ela|esse|essa|local|primeiro)\b/.test(
        texto,
      ) ||
      /^(ir|vamos|quero ir|rota para ele|rota para ela|rota para esse local)$/.test(
        texto,
      )
    )
  ) {
    return {dominio: 'pontos', acao: 'tracar_ultimo'};
  }

  if (
    conversa.aguardandoRefinoContato &&
    !/\b(abrir|abra|voltar|cancelar|ajuda)\b/.test(texto)
  ) {
    return {
      dominio: 'contatos',
      acao: 'consultar',
      termo: texto,
    };
  }

  return null;
};

const interpretarPerfil = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (
    /\b(qual|quais|mostrar|mostre|consultar|consulte|me diga)\b.*\b(meu|minha|meus|minhas)\b.*\b(email|e-mail)\b/.test(
      texto,
    )
  ) {
    return {dominio: 'perfil', acao: 'consultar', campo: 'email'};
  }

  if (
    /\b(qual|mostrar|mostre|consultar|consulte|me diga)\b.*\b(meu|minha)\b.*\b(setor|departamento)\b/.test(
      texto,
    )
  ) {
    return {dominio: 'perfil', acao: 'consultar', campo: 'setor'};
  }

  if (/\b(meus dados|meu cadastro|resumo do meu perfil)\b/.test(texto)) {
    return {dominio: 'perfil', acao: 'consultar', campo: 'resumo'};
  }

  return null;
};

const interpretarAplicativo = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null =>
  /\b(qual|consultar|mostrar|mostre|me diga)\b.*\b(versao|versao do app|versao do aplicativo)\b/.test(
    texto,
  )
    ? {dominio: 'aplicativo', acao: 'consultar_versao'}
    : null;

const obterCategoriaPonto = (texto: string) => {
  if (/\b(restaurante|restaurantes|comida|almoco|jantar)\b/.test(texto)) {
    return 'Restaurante' as const;
  }

  if (/\b(posto|postos|combustivel|abastecer|gasolina|etanol)\b/.test(texto)) {
    return 'Posto de Combustível' as const;
  }

  return null;
};

const obterQuantidade = (texto: string): number => {
  const valorExplicito = texto.match(/\b([1-5])\b/)?.[1];
  if (valorExplicito) return Number(valorExplicito);
  if (/\b(cinco)\b/.test(texto)) return 5;
  if (/\b(quatro)\b/.test(texto)) return 4;
  if (/\b(tres)\b/.test(texto)) return 3;
  if (/\b(dois|duas)\b/.test(texto)) return 2;

  return 1;
};

const interpretarPontos = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const categoria = obterCategoriaPonto(texto);
  const mencionaProximidade =
    /\b(perto|proximo|proxima|proximos|proximas|mais perto|perto de mim)\b/.test(
      texto,
    );

  if (!categoria || !mencionaProximidade) return null;

  const querTracar =
    /\b(traca|tracar|trace|navegar|navegacao)\b/.test(texto) ||
    /\b(abrir|iniciar|comecar)\b.*\b(rota|maps|mapa)\b/.test(texto) ||
    /\b(me leva|ir)\b.*\b(restaurante|posto)\b/.test(texto);

  return {
    dominio: 'pontos',
    acao: querTracar ? 'tracar_mais_proximo' : 'mostrar_proximos',
    categoria,
    quantidade: querTracar ? 1 : obterQuantidade(texto),
  };
};

const limparTermoContato = (texto: string): string =>
  texto
    .replace(
      /\b(qual|quais|buscar|busque|consultar|consulte|encontrar|encontre|mostrar|mostre|me diga|informe|o|a|os|as|do|da|dos|das|de|contato|contatos|ramal|ddr|telefone|email|e-mail|colaborador|colaboradora|pessoa|departamento|setor)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

const interpretarContatos = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (!/\b(contato|contatos|ramal|ddr|telefone|email|e-mail)\b/.test(texto)) {
    return null;
  }

  if (/^\s*(abrir|abra|acessar|mostrar|mostre)\s+(os?\s+)?contatos?\s*$/.test(texto)) {
    return null;
  }

  const termo = limparTermoContato(texto);

  return termo
    ? {dominio: 'contatos', acao: 'consultar', termo}
    : null;
};

const interpretarHistorico = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const consultaResumo =
    /\b(quantas|quantos|resumo|resumir|realizei|fiz|visitei|consultar)\b/.test(
      texto,
    );
  const mencionaHistorico =
    /\b(historico|historicos|visitas|rotas)\b/.test(texto);

  if (!consultaResumo || !mencionaHistorico) return null;

  const tipo = /\b(restaurante|restaurantes)\b/.test(texto)
    ? TIPO_HISTORICO.RESTAURANTE
    : /\b(posto|postos|combustivel)\b/.test(texto)
      ? TIPO_HISTORICO.POSTO_COMBUSTIVEL
      : /\b(loja|lojas|filial|filiais)\b/.test(texto)
        ? TIPO_HISTORICO.LOJA
        : undefined;

  return {
    dominio: 'historico',
    acao: 'resumir',
    periodo: /\b(hoje|do dia|neste dia)\b/.test(texto) ? 'hoje' : 'geral',
    tipo,
  };
};

const interpretarChamados = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null =>
  /\b(quantos|resumo|resumir|consultar)\b.*\b(chamado|chamados)\b/.test(texto)
    ? {dominio: 'chamados', acao: 'resumir'}
    : null;

const interpretarPreferencias = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const mencionaVoz =
    /\b(voz|som|audio|assistente)\b/.test(texto) ||
    /\b(fala|falar|falando|responder em voz alta)\b/.test(texto);

  if (mencionaVoz) {
    if (
      /\b(status|como esta|esta|ta|continua)\b.*\b(voz|som|audio|ativada|ativa|ligada|desativada|muda)\b|\b(voz|som|audio)\b.*\b(esta|ta)\b/.test(
        texto,
      )
    ) {
      return {
        dominio: 'preferencias',
        acao: 'consultar_voz',
      };
    }

    if (
      /\b(desativar|desative|desliga|desligar|silencia|silenciar|silencioso|mudo|sem voz|tirar a voz|pare de falar|nao fale|nao responda por voz|fique quieta)\b/.test(
        texto,
      )
    ) {
      return {
        dominio: 'preferencias',
        acao: 'definir_voz',
        ativa: false,
      };
    }

    if (
      /\b(ativar|ative|habilitar|habilite|liga|ligar|com voz|volte a falar|responder falando)\b/.test(
        texto,
      )
    ) {
      return {
        dominio: 'preferencias',
        acao: 'definir_voz',
        ativa: true,
      };
    }
  }

  if (!/\b(tema|modo|aparencia)\b/.test(texto)) return null;

  if (/\b(escuro|noturno|dark)\b/.test(texto)) {
    return {
      dominio: 'preferencias',
      acao: 'definir_tema',
      modo: 'escuro',
    };
  }

  if (/\b(claro|light)\b/.test(texto)) {
    return {
      dominio: 'preferencias',
      acao: 'definir_tema',
      modo: 'claro',
    };
  }

  return null;
};

const interpretarSugestoes = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null =>
  /\b(enviar|mandar|fazer|registrar|abrir)\b.*\b(sugestao|melhoria|problema|feedback)\b/.test(
    texto,
  )
    ? {dominio: 'sugestoes', acao: 'abrir'}
    : null;

const DESTINOS: ReadonlyArray<{
  destino: DestinoAssistente;
  termos: RegExp;
}> = [
  {destino: 'mapa_filiais', termos: /\b(mapa de lojas|mapa das lojas|mapa de filiais|mapa das filiais)\b/},
  {destino: 'historico', termos: /\b(historico|historicos)\b/},
  {destino: 'pontos', termos: /\b(pontos de interesse|pontos|restaurantes|postos)\b/},
  {destino: 'preventiva', termos: /\b(preventiva|patrimonio|registro de patrimonio)\b/},
  {destino: 'chamados', termos: /\b(chamado|chamados)\b/},
  {destino: 'contatos', termos: /\b(contato|contatos|ramais)\b/},
  {destino: 'admin', termos: /\b(admin|administracao|area administrativa)\b/},
  {destino: 'perfil', termos: /\b(perfil|meu cadastro|minha conta)\b/},
  {destino: 'sobre', termos: /\b(sobre o aplicativo|sobre o app|informacoes do aplicativo)\b/},
  {destino: 'inicio', termos: /\b(inicio|home|tela de rotas|minhas rotas)\b/},
];

const interpretarNavegacao = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (/^(voltar|volta|retornar|retorne|tela anterior)$/.test(texto)) {
    return {dominio: 'navegacao', acao: 'voltar'};
  }

  if (!/\b(abrir|abra|acessar|acesse|entrar|ir|mostrar|mostre|levar|leve)\b/.test(texto)) {
    return null;
  }

  const destino = DESTINOS.find(item => item.termos.test(texto))?.destino;

  return destino
    ? {dominio: 'navegacao', acao: 'abrir', destino}
    : null;
};

const ARVORE_INTENCOES: NoIntencao = {
  id: 'raiz',
  filhos: [
    {id: 'confirmacao', interpretar: interpretarConfirmacao},
    {id: 'contexto', interpretar: interpretarContexto},
    {id: 'orientacao', interpretar: interpretarOrientacao},
    {id: 'ajuda', interpretar: interpretarAjuda},
    {id: 'perfil', interpretar: interpretarPerfil},
    {
      id: 'consultas',
      filhos: [
        {id: 'pontos', interpretar: interpretarPontos},
        {id: 'contatos', interpretar: interpretarContatos},
        {id: 'historico', interpretar: interpretarHistorico},
        {id: 'chamados', interpretar: interpretarChamados},
      ],
    },
    {id: 'aplicativo', interpretar: interpretarAplicativo},
    {id: 'preferencias', interpretar: interpretarPreferencias},
    {id: 'sugestoes', interpretar: interpretarSugestoes},
    {id: 'navegacao', interpretar: interpretarNavegacao},
  ],
};

/**
 * Percorre a árvore em profundidade. Ramos específicos têm prioridade sobre
 * navegação genérica, evitando que "mostrar restaurante próximo" apenas abra
 * a tela de pontos.
 */
const percorrerArvore = (
  no: NoIntencao,
  contexto: ContextoInterpretacao,
): ComandoAssistente | null => {
  const comando = no.interpretar?.(contexto);
  if (comando) return comando;

  for (const filho of no.filhos ?? []) {
    const resultado = percorrerArvore(filho, contexto);
    if (resultado) return resultado;
  }

  return null;
};

/**
 * Prefere intenções de domínio e de contexto às ações genéricas de navegação.
 * A posição da alternativa ainda pesa no resultado porque o serviço nativo
 * devolve as transcrições em ordem de confiança.
 */
const pontuarComando = (comando: ComandoAssistente): number => {
  if (comando.dominio === 'pontos' && comando.acao === 'tracar_ultimo') {
    return 150;
  }

  if (comando.dominio === 'pontos') return 140;
  if (
    comando.dominio === 'contatos' ||
    comando.dominio === 'historico' ||
    comando.dominio === 'chamados'
  ) {
    return 130;
  }
  if (comando.dominio === 'perfil') return 125;
  if (comando.dominio === 'sistema' && comando.acao === 'orientar') return 120;
  if (
    comando.dominio === 'preferencias' ||
    comando.dominio === 'aplicativo' ||
    comando.dominio === 'sugestoes'
  ) {
    return 115;
  }
  if (comando.dominio === 'sistema') return 110;

  return 100;
};

export const interpretarComandoAssistente = (
  transcricoes: readonly string[],
  conversa: ContextoInterpretacaoAssistente = {},
): ResultadoInterpretacaoAssistente | null => {
  let melhorResultado: ResultadoInterpretacaoAssistente | null = null;
  let melhorPontuacao = -Infinity;

  transcricoes.forEach((transcricao, indice) => {
    const original = transcricao.trim();
    if (!original) return;

    const comando = percorrerArvore(ARVORE_INTENCOES, {
      texto: normalizarTexto(original),
      conversa,
    });

    if (!comando) return;

    const pontuacao = pontuarComando(comando) - indice * 8;

    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorResultado = {comando, transcricao: original};
    }
  });

  return melhorResultado;
};
