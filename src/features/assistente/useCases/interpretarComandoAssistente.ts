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
    !/\b(como|me ensina|me explique|me explica|o que fazer)\b/.test(
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
  if (conversa.ultimoDepartamento) {
    if (
      /^(e )?(quantas|quantos|quantas pessoas|quantos colaboradores|qual o total)( trabalham| tem| ha)?( nele| nela| nesse departamento| nessa area)?$/.test(
        texto,
      )
    ) {
      return {
        dominio: 'contatos',
        acao: 'contar_pessoas',
        departamento: conversa.ultimoDepartamento,
      };
    }

    if (
      /^(e )?(quem|quais pessoas|quais colaboradores)( mais)?( trabalha| trabalham)?( nele| nela| nesse departamento| nessa area| com ele| com ela)?$/.test(
        texto,
      )
    ) {
      return {
        dominio: 'contatos',
        acao: 'listar_pessoas',
        departamento: conversa.ultimoDepartamento,
      };
    }
  }

  if (conversa.possuiUltimoContato) {
    if (
      /^(e )?(qual |mostre |me diga )?(o )?(email|e-mail)( dele| dela| desse contato| dessa pessoa)?$/.test(
        texto,
      )
    ) {
      return {
        dominio: 'contatos',
        acao: 'consultar_ultimo',
        campo: 'email',
      };
    }

    if (
      /^(e )?(qual |mostre |me diga )?(o )?(ramal|telefone|ddr|numero)( dele| dela| desse contato| dessa pessoa)?$/.test(
        texto,
      )
    ) {
      return {
        dominio: 'contatos',
        acao: 'consultar_ultimo',
        campo: 'telefone',
      };
    }

    if (/^(e )?(ele|ela|esse contato|essa pessoa)$/.test(texto)) {
      return {
        dominio: 'contatos',
        acao: 'consultar_ultimo',
        campo: 'resumo',
      };
    }
  }

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

const obterQuantidadeAnalise = (texto: string): number => {
  const numero = texto.match(/\b(?:top\s*)?([1-5])\b/)?.[1];
  if (numero) return Number(numero);
  if (/\bcinco\b/.test(texto)) return 5;
  if (/\bquatro\b/.test(texto)) return 4;
  if (/\btres\b/.test(texto)) return 3;
  if (/\b(dois|duas)\b/.test(texto)) return 2;

  return 1;
};

const limparTermoCidade = (texto: string): string =>
  texto
    .replace(
      /\b(quantas|quantos|qual|quais|numero|total|de|filial|filiais|loja|lojas|existem|existe|tem|ha|ficam|estao|cadastradas|cadastrados|na|no|em|a|o|cidade)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

/** Entende perguntas quantitativas sobre a distribuição das filiais. */
const interpretarAnaliseFiliais = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  if (
    /\b(visitei|visitadas|historico|rota|rotas|hoje|ontem|semana|mes)\b/.test(
      texto,
    )
  ) {
    return null;
  }

  const mencionaFilial = /\b(filial|filiais|loja|lojas)\b/.test(texto);
  const mencionaCidade = /\b(cidade|cidades)\b/.test(texto);
  const mencionaRegiao = /\b(regiao|regioes|regional|regionais)\b/.test(texto);
  const pedeRanking =
    /\b(mais|maior|menos|menor|quente|concentracao|concentradas|ranking|top)\b/.test(
      texto,
    );

  if (pedeRanking && (mencionaFilial || mencionaCidade || mencionaRegiao)) {
    return {
      dominio: 'filiais',
      acao: 'ranking',
      agrupamento: mencionaRegiao ? 'regiao' : 'cidade',
      ordem: /\b(menos|menor)\b/.test(texto) ? 'menos' : 'mais',
      quantidade: obterQuantidadeAnalise(texto),
    };
  }

  if (
    mencionaCidade &&
    mencionaFilial &&
    /\b(quais|listar|liste|mostrar|mostre|onde)\b/.test(texto)
  ) {
    return {dominio: 'filiais', acao: 'listar_cidades'};
  }

  if (!mencionaFilial || !/\b(quantas|quantos|numero|total)\b/.test(texto)) {
    return null;
  }

  const trechoCidade = texto.match(
    /(?:\bcidade\s+(?:de\s+)?|\b(?:em|na|no)\s+)([a-z][a-z\s.-]*)$/,
  )?.[1];
  const termo = trechoCidade ? limparTermoCidade(trechoCidade) : '';

  return termo
    ? {dominio: 'filiais', acao: 'contar_cidade', termo}
    : {dominio: 'filiais', acao: 'contar_total'};
};

const limparTermoMapa = (texto: string): string =>
  texto
    .replace(
      /\b(onde|fica|localizar|localize|procurar|procure|buscar|busque|mostrar|mostre|abrir|abra|ver|quero|ir|mapa|em|no|na|do|da|das|dos|de|a|o|as|os|filial|filiais|loja|lojas|codigo|numero)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s+(?=\d)/g, '$1')
    .trim();

/** Entende pesquisas no mapa por código, nome, cidade ou endereço. */
const interpretarMapa = ({
  texto,
  conversa,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const mencionaMapa = /\b(mapa|onde fica|localizar|localize)\b/.test(texto);
  const estaNoMapa = conversa.telaAtual === 'MapaLojas';
  const mencionaFilial = /\b(filial|filiais|loja|lojas)\b/.test(texto);

  if (!mencionaMapa && !estaNoMapa) return null;
  if (!mencionaFilial && !estaNoMapa) return null;
  if (
    estaNoMapa &&
    !mencionaFilial &&
    /\b(ponto|restaurante|posto|contato|historico|chamado|perfil|patrimonio)\b/.test(
      texto,
    )
  ) {
    return null;
  }
  if (
    estaNoMapa &&
    !mencionaMapa &&
    /\b(tracar|trace|rota|adicionar|adicione|remover|remova)\b/.test(texto)
  ) {
    return null;
  }

  const termo = limparTermoMapa(texto);

  return termo
    ? {dominio: 'mapa', acao: 'pesquisar_filiais', termo}
    : null;
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

const limparTermoPonto = (texto: string): string =>
  texto
    .replace(
      /\b(onde|fica|localizar|localize|procurar|procure|buscar|busque|encontrar|encontre|mostrar|mostre|abrir|abra|ver|quero|ir|leve|levar|tracar|trace|rota|mapa|ponto|pontos|de|do|da|dos|das|em|no|na|a|o|as|os|para|pra|pro|ate|restaurante|restaurantes|posto|postos|combustivel)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

const interpretarPontos = ({
  texto,
  conversa,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const categoria = obterCategoriaPonto(texto);
  const mencionaProximidade =
    /\b(perto|proximo|proxima|proximos|proximas|mais perto|perto de mim)\b/.test(
      texto,
    );

  const querTracar =
    /\b(traca|tracar|trace|navegar|navegacao)\b/.test(texto) ||
    /\b(abrir|iniciar|comecar)\b.*\b(rota|maps|mapa)\b/.test(texto) ||
    /\b(me leva|ir)\b.*\b(restaurante|posto)\b/.test(texto);

  if (categoria && mencionaProximidade) {
    return {
      dominio: 'pontos',
      acao: querTracar ? 'tracar_mais_proximo' : 'mostrar_proximos',
      categoria,
      quantidade: querTracar ? 1 : obterQuantidade(texto),
    };
  }

  const estaEmPontos = conversa.telaAtual === 'Pontos';
  const mencionaPonto =
    Boolean(categoria) || /\b(ponto|pontos de interesse)\b/.test(texto);
  const pareceBusca =
    /\b(onde|localizar|procurar|buscar|encontrar|mostrar|abrir|ir|tracar|rota|em)\b/.test(
      texto,
    );

  if (
    estaEmPontos &&
    !mencionaPonto &&
    /\b(contato|historico|mapa|filial|loja|chamado|perfil|patrimonio)\b/.test(
      texto,
    )
  ) {
    return null;
  }

  if (!(estaEmPontos || (mencionaPonto && pareceBusca))) return null;

  const termo = limparTermoPonto(texto);

  if (!termo) return null;

  return {
    dominio: 'pontos',
    acao: 'buscar',
    termo,
    categoria: categoria ?? undefined,
    iniciarRota: querTracar,
  };
};

const limparTermoContato = (texto: string): string =>
  texto
    .replace(
      /\b(qual|quais|quem|e|eh|trabalha|trabalham|buscar|busque|consultar|consulte|encontrar|encontre|mostrar|mostre|me diga|informe|o|a|os|as|do|da|dos|das|de|no|na|em|contato|contatos|ramal|ddr|telefone|email|e-mail|colaborador|colaboradora|pessoa|departamento|setor)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s+(?=\d)/g, '$1')
    .trim();

const extrairDepartamento = (texto: string): string | undefined => {
  const trechoComMarcador = texto.match(
    /\b(?:departamento|setor|area)\s+(?:de\s+)?([a-z][a-z\s.-]*)$/,
  )?.[1];
  const trecho = trechoComMarcador ?? texto.match(
    /\b(?:em|no|na|de|do|da)\s+([a-z][a-z\s.-]*)$/,
  )?.[1];
  const departamento = (trecho ?? texto)
    .replace(
      /\b(quantas|quantos|qual|quais|quem|pessoa|pessoas|colaborador|colaboradores|funcionario|funcionarios|contato|contatos|trabalha|trabalham|tem|ha|listar|liste|mostrar|mostre|departamento|setor|area|todos|todas|cadastrados|cadastradas)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  return departamento || undefined;
};

/** Entende listagens e contagens da estrutura de contatos. */
const interpretarAnaliseContatos = ({
  texto,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const mencionaDepartamento = /\b(departamento|departamentos|setor|setores|area|areas)\b/.test(
    texto,
  );
  const pedeRanking = /\b(mais|maior|menos|menor|ranking|top)\b/.test(texto);

  if (
    mencionaDepartamento &&
    pedeRanking &&
    /\b(pessoa|pessoas|colaborador|colaboradores|funcionario|funcionarios|contato|contatos)\b/.test(
      texto,
    )
  ) {
    return {
      dominio: 'contatos',
      acao: 'ranking_departamentos',
      ordem: /\b(menos|menor)\b/.test(texto) ? 'menos' : 'mais',
      quantidade: obterQuantidadeAnalise(texto),
    };
  }

  if (
    /\b(listar|liste|mostrar|mostre|quais|quantos)\b.*\b(departamentos|setores|areas)\b/.test(
      texto,
    ) || /\b(departamentos|setores)\b.*\b(disponiveis|cadastrados|existem)\b/.test(texto)
  ) {
    return {dominio: 'contatos', acao: 'listar_departamentos'};
  }

  const mencionaPessoas =
    /\b(pessoa|pessoas|colaborador|colaboradores|funcionario|funcionarios|contato|contatos)\b/.test(
      texto,
    );
  const perguntaQuem = /\b(quem trabalha|quem esta|quem faz parte)\b/.test(texto);
  const pedeLista = /\b(listar|liste|mostrar|mostre|quais)\b/.test(texto);
  const pedeContagem = /\b(quantas|quantos|numero|total)\b/.test(texto);

  if (!(perguntaQuem || (mencionaPessoas && (pedeLista || pedeContagem)))) {
    return null;
  }

  const departamento = extrairDepartamento(texto);

  return {
    dominio: 'contatos',
    acao: pedeContagem ? 'contar_pessoas' : 'listar_pessoas',
    departamento,
  };
};

const interpretarContatos = ({
  texto,
  conversa,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const mencionaContato =
    /\b(contato|contatos|ramal|ddr|telefone|email|e-mail|departamento|setor)\b/.test(
      texto,
    );

  if (
    conversa.telaAtual === 'Contatos' &&
    !mencionaContato &&
    /\b(historico|mapa|filial|loja|ponto|restaurante|posto|chamado|perfil|patrimonio|rota|tracar|adicionar|remover)\b/.test(
      texto,
    )
  ) {
    return null;
  }

  if (!mencionaContato && conversa.telaAtual !== 'Contatos') {
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
  conversa,
}: ContextoInterpretacao): ComandoAssistente | null => {
  const tipo = /\b(restaurante|restaurantes)\b/.test(texto)
    ? TIPO_HISTORICO.RESTAURANTE
    : /\b(posto|postos|combustivel)\b/.test(texto)
      ? TIPO_HISTORICO.POSTO_COMBUSTIVEL
      : /\b(loja|lojas|filial|filiais)\b/.test(texto)
        ? TIPO_HISTORICO.LOJA
        : undefined;
  const consultaUltimo =
    /\b(ultimo|ultima|mais recente)\b.*\b(registro|historico|visita|local|destino|loja|filial|restaurante|posto)\b/.test(
      texto,
    ) || /\b(onde|qual local)\b.*\b(fui|visitei)\b.*\b(ultima vez|por ultimo)\b/.test(texto);

  if (consultaUltimo) {
    return {
      dominio: 'historico',
      acao: 'consultar_ultimo',
      tipo,
    };
  }

  const consultaResumo =
    /\b(quantas|quantos|resumo|resumir|realizei|fiz|visitei|consultar|consulta|mostrar|mostre|tive|foram)\b/.test(
      texto,
    );
  const mencionaHistorico =
    /\b(historico|historicos|visitas|rotas)\b/.test(texto);
  const mencionaPeriodo =
    /\b(hoje|ontem|semana|ultimos sete dias|ultimos 7 dias|mes|este mes|nesse mes)\b/.test(
      texto,
    );

  if (
    !(consultaResumo && (mencionaHistorico || Boolean(tipo))) &&
    !(conversa.telaAtual === 'Historico' && mencionaPeriodo)
  ) {
    return null;
  }

  const periodo = /\bontem\b/.test(texto)
    ? 'ontem' as const
    : /\b(semana|ultimos sete dias|ultimos 7 dias)\b/.test(texto)
      ? 'ultimos_7_dias' as const
      : /\b(mes|este mes|nesse mes)\b/.test(texto)
        ? 'mes_atual' as const
        : /\b(hoje|do dia|neste dia)\b/.test(texto)
          ? 'hoje' as const
          : 'geral' as const;

  return {
    dominio: 'historico',
    acao: 'resumir',
    periodo,
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
  {destino: 'mapa_filiais', termos: /\b(mapa (?:de |das? )?(?:lojas|filiais))\b/},
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
    {id: 'analise-filiais', interpretar: interpretarAnaliseFiliais},
    {id: 'mapa', interpretar: interpretarMapa},
    {
      id: 'consultas',
      filhos: [
        {id: 'pontos', interpretar: interpretarPontos},
        {id: 'analise-contatos', interpretar: interpretarAnaliseContatos},
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
  if (comando.dominio === 'filiais') return 139;
  if (comando.dominio === 'mapa') return 138;
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
