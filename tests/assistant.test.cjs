const assert = require('node:assert/strict');
const {test} = require('node:test');
const ts = require('typescript');

/*
 * Carrega apenas os casos de uso TypeScript puros. Assim os testes da árvore
 * rodam rapidamente no Node, sem iniciar o Expo ou depender de aparelho.
 */
require.extensions['.ts'] = (module, filename) => {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const {
  interpretarComandoAssistente,
} = require('../src/features/assistente/useCases/interpretarComandoAssistente.ts');
const {
  buscarContatosAssistente,
} = require('../src/features/assistente/useCases/buscarContatosAssistente.ts');
const {
  encontrarPontosProximos,
} = require('../src/features/assistente/useCases/encontrarPontosProximos.ts');
const {
  aguardarDadosAssistente,
} = require('../src/features/assistente/useCases/aguardarDadosAssistente.ts');
const {
  buscarFiliaisAssistente,
} = require('../src/features/assistente/useCases/buscarFiliaisAssistente.ts');
const {
  formatarDetalhesFilialAssistente,
} = require('../src/features/assistente/useCases/formatarDetalhesFilialAssistente.ts');
const {
  buscarPontosAssistente,
} = require('../src/features/assistente/useCases/buscarPontosAssistente.ts');
const {
  analisarFiliaisAssistente,
  encontrarCidadesAssistente,
  selecionarRankingFiliais,
} = require('../src/features/assistente/useCases/analisarFiliaisAssistente.ts');
const {
  agruparContatosPorDepartamento,
  encontrarDepartamentosAssistente,
} = require('../src/features/assistente/useCases/analisarContatosAssistente.ts');
const {
  definirAcaoGlobal,
} = require('../src/features/assistente/useCases/definirAcaoGlobal.ts');
const {
  selecionarComandoVozRota,
} = require('../src/features/rotas/useCases/selecionarComandoVozRota.ts');
const {
  resolverNavegadorRota,
} = require('../src/features/rotas/useCases/resolverNavegadorRota.ts');

test('usa sugestão como fallback e habilita assistente somente com flag ativa', () => {
  assert.equal(definirAcaoGlobal(true), 'assistente');
  assert.equal(definirAcaoGlobal(false), 'sugestao');
  assert.equal(definirAcaoGlobal(null), 'sugestao');
  assert.equal(definirAcaoGlobal(undefined), 'sugestao');
});

test('prioriza ponto próximo sobre navegação genérica', () => {
  const resultado = interpretarComandoAssistente([
    'mostre o restaurante mais próximo',
  ]);

  assert.deepEqual(resultado?.comando, {
    dominio: 'pontos',
    acao: 'mostrar_proximos',
    categoria: 'Restaurante',
    quantidade: 1,
  });

  const comAlternativas = interpretarComandoAssistente([
    'abrir pontos',
    'mostrar restaurante mais próximo',
  ]);

  assert.equal(comAlternativas?.comando.dominio, 'pontos');
});

test('usa o último ponto em uma continuação de conversa', () => {
  const resultado = interpretarComandoAssistente(
    ['agora me leve até ele'],
    {possuiUltimoPonto: true},
  );

  assert.deepEqual(resultado?.comando, {
    dominio: 'pontos',
    acao: 'tracar_ultimo',
  });
});

test('refina contato pelo nome sem exigir a palavra contato novamente', () => {
  const resultado = interpretarComandoAssistente(
    ['Ana Lúcia'],
    {aguardandoRefinoContato: true},
  );

  assert.deepEqual(resultado?.comando, {
    dominio: 'contatos',
    acao: 'consultar',
    termo: 'ana lucia',
  });
});

test('reconhece orientação e consulta do perfil', () => {
  assert.deepEqual(
    interpretarComandoAssistente(['como alterar minha senha'])?.comando,
    {dominio: 'sistema', acao: 'orientar', topico: 'perfil'},
  );
  assert.deepEqual(
    interpretarComandoAssistente(['qual é o meu e-mail'])?.comando,
    {dominio: 'perfil', acao: 'consultar', campo: 'email'},
  );
});

test('reconhece perguntas sobre capacidades e controle da voz', () => {
  [
    'O que você pode fazer?',
    'O que a assistente faz?',
    'Quais coisas você pode fazer?',
    'Do que você é capaz?',
    'Mostre suas funções',
  ].forEach(fala => {
    assert.deepEqual(
      interpretarComandoAssistente([fala])?.comando,
      {dominio: 'sistema', acao: 'ajuda'},
      fala,
    );
  });

  assert.deepEqual(
    interpretarComandoAssistente([
      'desativar a voz da assistente',
    ])?.comando,
    {
      dominio: 'preferencias',
      acao: 'definir_voz',
      ativa: false,
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente([
      'ativar respostas por voz',
    ])?.comando,
    {
      dominio: 'preferencias',
      acao: 'definir_voz',
      ativa: true,
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente([
      'a voz está ativada?',
    ])?.comando,
    {
      dominio: 'preferencias',
      acao: 'consultar_voz',
    },
  );
});

test('distribui comandos entre os demais ramos globais', () => {
  const cenarios = [
    [
      'abrir o mapa de filiais',
      {
        dominio: 'navegacao',
        acao: 'abrir',
        destino: 'mapa_filiais',
      },
    ],
    [
      'resumo do histórico de restaurantes de hoje',
      {
        dominio: 'historico',
        acao: 'resumir',
        periodo: 'hoje',
        tipo: 'restaurante',
      },
    ],
    [
      'ativar modo escuro',
      {
        dominio: 'preferencias',
        acao: 'definir_tema',
        modo: 'escuro',
      },
    ],
    [
      'abrir uma sugestão',
      {dominio: 'sugestoes', acao: 'abrir'},
    ],
    [
      'qual é a versão do aplicativo',
      {dominio: 'aplicativo', acao: 'consultar_versao'},
    ],
  ];

  cenarios.forEach(([fala, comandoEsperado]) => {
    assert.deepEqual(
      interpretarComandoAssistente([fala])?.comando,
      comandoEsperado,
      fala,
    );
  });
});

test('busca contatos ignorando acentos e prioriza o nome exato', () => {
  const resultados = buscarContatosAssistente(
    [
      {
        departamento: 'Benefícios',
        colaboradores: 'Ana Lúcia',
        ramal: '1218',
      },
      {
        departamento: 'Benefícios',
        colaboradores: 'Ana Maria',
        ramal: '1200',
      },
    ],
    'ana lucia',
  );

  assert.equal(resultados[0].contato.colaboradores, 'Ana Lúcia');
  assert.equal(resultados[0].pontuacao, 100);

  const resultadoComErroDeVoz = buscarContatosAssistente(
    resultados.map(item => item.contato),
    'ana lusia',
  );
  assert.equal(
    resultadoComErroDeVoz[0].contato.colaboradores,
    'Ana Lúcia',
  );
});

test('ordena pontos pela distância e respeita a categoria', () => {
  const pontos = encontrarPontosProximos(
    [
      {
        descricao: 'Restaurante distante',
        categoria: 'Restaurante',
        latitude: -22.75,
        longitude: -47.65,
      },
      {
        descricao: 'Restaurante perto',
        categoria: 'Restaurante',
        latitude: -22.725,
        longitude: -47.645,
      },
      {
        descricao: 'Posto perto',
        categoria: 'Posto de Combustível',
        latitude: -22.724,
        longitude: -47.644,
      },
    ],
    {latitude: -22.724, longitude: -47.644},
    'Restaurante',
    2,
  );

  assert.deepEqual(
    pontos.map(item => item.ponto.descricao),
    ['Restaurante perto', 'Restaurante distante'],
  );

  const postoComCategoriaSimplificada = encontrarPontosProximos(
    [
      {
        descricao: 'Posto simplificado',
        categoria: 'Posto',
        latitude: '-22,724',
        longitude: '-47,644',
      },
    ],
    {latitude: -22.724, longitude: -47.644},
    'Posto de Combustível',
    1,
  );
  assert.equal(
    postoComCategoriaSimplificada[0].ponto.descricao,
    'Posto simplificado',
  );
});

test('limita a espera sem cancelar o carregamento original', async () => {
  assert.deepEqual(
    await aguardarDadosAssistente(Promise.resolve(['cache']), 50),
    {status: 'concluido', valor: ['cache']},
  );

  let concluir;
  const carregamento = new Promise(resolve => {
    concluir = resolve;
  });
  const resultado = await aguardarDadosAssistente(carregamento, 5);

  assert.deepEqual(resultado, {status: 'tempo_esgotado'});
  concluir(['carregado depois']);
});

test('recupera pausas perdidas entre códigos reais de filiais', () => {
  const resultado = selecionarComandoVozRota(
    ['traçar rota para filial 2535 48'],
    new Set([25, 35, 48]),
  );

  assert.deepEqual(resultado.comando, {
    tipo: 'adicionar_e_tracar',
    codigos: [25, 35, 48],
  });
});

test('entende pedido direto de rota e preserva o navegador pronunciado', () => {
  assert.deepEqual(
    selecionarComandoVozRota(
      ['me leve para as lojas 25, 35 e 48 pelo Maps'],
      new Set([25, 35, 48]),
    ).comando,
    {
      tipo: 'adicionar_e_tracar',
      codigos: [25, 35, 48],
      navegador: 'google',
    },
  );
  assert.deepEqual(
    selecionarComandoVozRota(
      ['abrir a filial 25 no Waze'],
      new Set([25]),
    ).comando,
    {
      tipo: 'adicionar_e_tracar',
      codigos: [25],
      navegador: 'waze',
    },
  );
  assert.deepEqual(
    selecionarComandoVozRota(
      ['como chegar na filial quarenta e oito'],
      new Set([48]),
    ).comando,
    {
      tipo: 'adicionar_e_tracar',
      codigos: [48],
    },
  );
  assert.deepEqual(
    selecionarComandoVozRota(
      ['manda pro Google a rota das lojas 25 e 35'],
      new Set([25, 35]),
    ).comando,
    {
      tipo: 'adicionar_e_tracar',
      codigos: [25, 35],
      navegador: 'google',
    },
  );
});

test('usa preferência somente quando segura e preserva todas as paradas', () => {
  assert.deepEqual(
    resolverNavegadorRota({
      quantidadeDestinos: 1,
      navegadorPreferido: 'waze',
    }),
    {navegador: 'waze', wazeSubstituidoPorGoogle: false},
  );
  assert.deepEqual(
    resolverNavegadorRota({
      quantidadeDestinos: 3,
      navegadorSolicitado: 'waze',
      navegadorPreferido: 'waze',
    }),
    {navegador: 'google', wazeSubstituidoPorGoogle: true},
  );
});

test('pesquisa filiais no mapa por código, cidade e contexto da tela', () => {
  assert.deepEqual(
    interpretarComandoAssistente(['onde fica a filial 25'])?.comando,
    {dominio: 'mapa', acao: 'pesquisar_filiais', termo: '25'},
  );
  assert.deepEqual(
    interpretarComandoAssistente(['Campinas'], {telaAtual: 'MapaLojas'})
      ?.comando,
    {dominio: 'mapa', acao: 'pesquisar_filiais', termo: 'campinas'},
  );
  assert.deepEqual(
    interpretarComandoAssistente(['abrir o mapa de filiais'])?.comando,
    {dominio: 'navegacao', acao: 'abrir', destino: 'mapa_filiais'},
  );
  assert.equal(
    interpretarComandoAssistente(['traçar rota 25'], {
      telaAtual: 'MapaLojas',
    }),
    null,
  );

  const resultados = buscarFiliaisAssistente(
    [
      {codigofilial: 25, nomefilial: 'Drogal Centro', nomecidade: 'Campinas'},
      {codigofilial: 35, nomefilial: 'Drogal Norte', nomecidade: 'Limeira'},
    ],
    '25',
  );
  assert.equal(resultados[0].filial.codigofilial, 25);
});

test('busca pontos pelo nome ou cidade e distingue pedido de rota', () => {
  assert.deepEqual(
    interpretarComandoAssistente([
      'mostrar restaurante Fogão a Lenha',
    ])?.comando,
    {
      dominio: 'pontos',
      acao: 'buscar',
      termo: 'fogao lenha',
      categoria: 'Restaurante',
      iniciarRota: false,
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['trace rota para o posto Shell'])?.comando,
    {
      dominio: 'pontos',
      acao: 'buscar',
      termo: 'shell',
      categoria: 'Posto de Combustível',
      iniciarRota: true,
    },
  );

  const resultados = buscarPontosAssistente(
    [
      {
        descricao: 'Posto Shell Centro',
        categoria: 'Posto de Combustível',
        cidadePonto: 'Limeira',
        latitude: -22.5,
        longitude: -47.4,
      },
    ],
    'shell centro',
    'Posto de Combustível',
  );
  assert.equal(resultados[0].ponto.descricao, 'Posto Shell Centro');
});

test('entende períodos e a última visita no histórico', () => {
  assert.deepEqual(
    interpretarComandoAssistente([
      'quantas filiais visitei esta semana',
    ])?.comando,
    {
      dominio: 'historico',
      acao: 'resumir',
      periodo: 'ultimos_7_dias',
      tipo: 'loja',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['qual foi minha última filial visitada'])
      ?.comando,
    {
      dominio: 'historico',
      acao: 'consultar_ultimo',
      tipo: 'loja',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['ontem'], {telaAtual: 'Historico'})
      ?.comando,
    {
      dominio: 'historico',
      acao: 'resumir',
      periodo: 'ontem',
      tipo: undefined,
    },
  );
});

test('usa contexto da tela e memória curta para contatos', () => {
  assert.deepEqual(
    interpretarComandoAssistente([
      'quem trabalha no departamento Benefícios',
    ])?.comando,
    {
      dominio: 'contatos',
      acao: 'listar_pessoas',
      departamento: 'beneficios',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['Ana Lúcia'], {telaAtual: 'Contatos'})
      ?.comando,
    {dominio: 'contatos', acao: 'consultar', termo: 'ana lucia'},
  );
  assert.deepEqual(
    interpretarComandoAssistente(['consultar ramal 1 2 1 8'])?.comando,
    {dominio: 'contatos', acao: 'consultar', termo: '1218'},
  );
  assert.deepEqual(
    interpretarComandoAssistente(['e o ramal dela'], {
      possuiUltimoContato: true,
    })?.comando,
    {
      dominio: 'contatos',
      acao: 'consultar_ultimo',
      campo: 'telefone',
    },
  );
  assert.equal(
    interpretarComandoAssistente(['traçar rota 25'], {
      telaAtual: 'Contatos',
    }),
    null,
  );

  const porDdr = buscarContatosAssistente(
    [
      {
        departamento: 'Benefícios',
        colaboradores: 'Ana Lúcia',
        ddr: '(19) 3429-1218',
      },
    ],
    '1934291218',
  );
  assert.equal(porDdr[0].contato.colaboradores, 'Ana Lúcia');
});

test('entende análises naturais sobre cidades e filiais', () => {
  const cenarios = [
    [
      'quantas filiais existem em Piracicaba',
      {dominio: 'filiais', acao: 'contar_cidade', termo: 'piracicaba'},
    ],
    [
      'qual cidade tem mais filiais',
      {
        dominio: 'filiais',
        acao: 'ranking',
        agrupamento: 'cidade',
        ordem: 'mais',
        quantidade: 1,
      },
    ],
    [
      'top 3 cidades com menos lojas',
      {
        dominio: 'filiais',
        acao: 'ranking',
        agrupamento: 'cidade',
        ordem: 'menos',
        quantidade: 3,
      },
    ],
    [
      'qual é a região mais quente',
      {
        dominio: 'filiais',
        acao: 'ranking',
        agrupamento: 'regiao',
        ordem: 'mais',
        quantidade: 1,
      },
    ],
    [
      'quais cidades possuem filiais',
      {dominio: 'filiais', acao: 'listar_cidades'},
    ],
    [
      'qual o total de lojas',
      {dominio: 'filiais', acao: 'contar_total'},
    ],
  ];

  cenarios.forEach(([fala, esperado]) => {
    assert.deepEqual(
      interpretarComandoAssistente([fala])?.comando,
      esperado,
      fala,
    );
  });
});

test('consulta dados reais da filial e mantém contexto para continuação', () => {
  assert.deepEqual(
    interpretarComandoAssistente(['qual o telefone da filial 25'])?.comando,
    {
      dominio: 'filiais',
      acao: 'consultar',
      termo: '25',
      campo: 'telefone',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['que horas fecha a loja 48'])?.comando,
    {
      dominio: 'filiais',
      acao: 'consultar',
      termo: '48',
      campo: 'horario',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['quem é o gerente da filial 35'])?.comando,
    {
      dominio: 'filiais',
      acao: 'consultar',
      termo: '35',
      campo: 'gerente',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['e o endereço dela'], {
      possuiUltimaFilial: true,
    })?.comando,
    {
      dominio: 'filiais',
      acao: 'consultar_ultima',
      campo: 'endereco',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['e qual é o telefone dela'], {
      possuiUltimaFilial: true,
    })?.comando,
    {
      dominio: 'filiais',
      acao: 'consultar_ultima',
      campo: 'telefone',
    },
  );

  const filial = {
    codigofilial: 25,
    nomefilial: 'Drogal Centro',
    nomecidade: 'Piracicaba',
    uf: 'SP',
    endereco: 'Rua Governador',
    numero: '123',
    bairro: 'Centro',
    cep: '13400-000',
    telefone: '(19) 3400-0000',
    gerente: 'Maria Souza',
    horariofuncionamento: 'Segunda a sábado, das 8h às 22h',
  };
  const endereco = formatarDetalhesFilialAssistente(filial, 'endereco');
  assert.match(endereco.visual, /Rua Governador, 123/);
  assert.match(endereco.visual, /CEP 13400-000/);
  assert.match(
    formatarDetalhesFilialAssistente(filial, 'resumo').visual,
    /Gerente: Maria Souza/,
  );
  assert.match(
    formatarDetalhesFilialAssistente(filial, 'supervisor').visual,
    /não possui supervisor informado/,
  );
});

test('calcula distribuição de filiais sem duplicar códigos', () => {
  const analise = analisarFiliaisAssistente([
    {codigofilial: 1, nomefilial: 'Centro', nomecidade: 'Piracicaba', regiao: 'Centro'},
    {codigofilial: 1, nomefilial: 'Centro repetida', nomecidade: 'Piracicaba', regiao: 'Centro'},
    {codigofilial: 2, nomefilial: 'Norte', nomecidade: 'Piracicaba', regiao: 'Centro'},
    {codigofilial: 3, nomefilial: 'Limeira', nomecidade: 'Limeira', regiao: 'Leste'},
  ]);

  assert.equal(analise.total, 3);
  assert.deepEqual(analise.cidades[0], {nome: 'Piracicaba', quantidade: 2});
  assert.deepEqual(analise.regioes[0], {nome: 'Centro', quantidade: 2});
  assert.equal(
    encontrarCidadesAssistente(analise.cidades, 'piracicaba')[0].quantidade,
    2,
  );
  assert.equal(
    selecionarRankingFiliais(analise.cidades, 'menos', 1)[0].nome,
    'Limeira',
  );
});

test('lista departamentos, pessoas e continua a conversa pelo contexto', () => {
  const departamentos = agruparContatosPorDepartamento([
    {id: 1, departamento: 'Benefícios', colaboradores: 'Ana Lúcia'},
    {id: 1, departamento: 'Benefícios', colaboradores: 'Ana repetida'},
    {id: 2, departamento: 'Benefícios', colaboradores: 'Bruno Souza'},
    {id: 3, departamento: 'Financeiro', colaboradores: 'Carla Lima'},
  ]);

  assert.equal(departamentos.length, 2);
  assert.equal(
    encontrarDepartamentosAssistente(departamentos, 'beneficios')[0].pessoas.length,
    2,
  );
  assert.deepEqual(
    interpretarComandoAssistente(['listar departamentos'])?.comando,
    {dominio: 'contatos', acao: 'listar_departamentos'},
  );
  assert.deepEqual(
    interpretarComandoAssistente(['quantas pessoas trabalham em Benefícios'])
      ?.comando,
    {
      dominio: 'contatos',
      acao: 'contar_pessoas',
      departamento: 'beneficios',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['qual departamento tem mais pessoas'])
      ?.comando,
    {
      dominio: 'contatos',
      acao: 'ranking_departamentos',
      ordem: 'mais',
      quantidade: 1,
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['listar pessoas de Benefícios'])?.comando,
    {
      dominio: 'contatos',
      acao: 'listar_pessoas',
      departamento: 'beneficios',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['e quem mais trabalha nesse departamento'], {
      ultimoDepartamento: 'Benefícios',
    })?.comando,
    {
      dominio: 'contatos',
      acao: 'listar_pessoas',
      departamento: 'Benefícios',
    },
  );
  assert.deepEqual(
    interpretarComandoAssistente(['e quantas'], {
      ultimoDepartamento: 'Benefícios',
    })?.comando,
    {
      dominio: 'contatos',
      acao: 'contar_pessoas',
      departamento: 'Benefícios',
    },
  );
});

test('entende posições e sequências naturais na rota', () => {
  assert.deepEqual(
    selecionarComandoVozRota(
      ['remova a segunda parada'],
      new Set([25, 35, 48]),
    ).comando,
    {tipo: 'remover_referencia', alvo: {tipo: 'posicao', posicao: 2}},
  );
  assert.deepEqual(
    selecionarComandoVozRota(
      ['troque a primeira parada pela 48'],
      new Set([25, 35, 48]),
    ).comando,
    {
      tipo: 'substituir_filial',
      alvo: {tipo: 'posicao', posicao: 1},
      novoCodigo: 48,
    },
  );
  assert.deepEqual(
    selecionarComandoVozRota(
      ['primeiro 25 depois 35 e por fim 48'],
      new Set([25, 35, 48]),
    ).comando,
    {tipo: 'adicionar_filiais', codigos: [25, 35, 48]},
  );
});
