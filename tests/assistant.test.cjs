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
  selecionarComandoVozRota,
} = require('../src/features/rotas/useCases/selecionarComandoVozRota.ts');

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
      'quantos chamados eu tenho',
      {dominio: 'chamados', acao: 'resumir'},
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
