# Painel administrativo

Entrada das funções administrativas de monitoramento, mapa de colaboradores e
redefinição de senha.
A feature não acessa collections genéricas: o resumo de rotas passa por
`GET /api/painel-admin/rotas/resumo` e a geometria de uma única execução por
`GET /api/painel-admin/rotas/:codigoSessao/trajeto`; usuários são consultados
por `GET /api/painel-admin/usuarios` e redefinidos por
`POST /api/painel-admin/usuarios/:usuarioId/redefinir-senha`.
O mapa operacional usa exclusivamente
`GET /api/painel-admin/colaboradores/localizacoes`.

## Acesso

- `ADMIN`: todos os setores;
- `GESTOR`: somente quando `painelAdminGestoresAtivo=true` e limitado ao setor
  presente no JWT;
- demais cargos: `403`, mesmo que recebam o menu por configuração incorreta.

O escopo e o rollout são decididos no Strapi. Com a flag ausente, desligada ou
indisponível, gestores não recebem a rota `Admin` e os endpoints respondem
`403`; administradores permanecem autorizados. O aplicativo nunca envia um
setor para ampliar a consulta.

## Entrada

A primeira tela contém `Monitoramento de rotas`, `Mapa de colaboradores` e
`Trocar senha`. Cada módulo possui retorno próprio para essa entrada, mantendo
filtros e estados técnicos fora da navegação global.

## Monitoramento

- **Período explícito**: os campos `De` e `Até` permitem selecionar os dias
  exatos, com limite de 31 dias; Hoje, 7 dias e 30 dias permanecem como atalhos;
- **Filtros compactos**: a tela mostra somente o período e os filtros aplicados;
  a edição de datas, pesquisa e resultado fica concentrada em um único painel,
  e uma ação aplica tudo sem fazer consultas durante o preenchimento;
- **Colaborador**: sem seleção, todas as rotas do escopo são exibidas. Ao abrir
  o campo, uma lista paginada permite rolar ou pesquisar por nome usando
  `GET /api/painel-admin/usuarios`; o Strapi devolve todos para ADMIN e somente
  o próprio setor para GESTOR, sem o aplicativo enviar setor;
- **Resumo operacional**: apresenta apenas rotas abertas, confirmadas,
  interrompidas e destinos confirmados; explicações ficam no detalhe;
- **Percursos**: lista resumida, paginação e atualização por gesto;
- **Detalhe**: começa com uma explicação em linguagem comum sobre o que aconteceu
  e mantém horários, planejamento, localização, sincronização, encerramento e
  destinos como evidências consultáveis;
- **Mapa do trajeto**: aberto sob demanda também para uma execução em andamento.
  A tela consulta o servidor a cada 15 segundos e desenha a polyline parcial
  consolidada a cada lote recebido, sem reposicionar a câmera a cada atualização;
- **Mapa de colaboradores**: mostra uma posição por usuário, atualiza a cada
  30 segundos e nunca chama uma sessão ativa de presença online. Até 2 minutos
  é `Atual`, até 15 é `Recente`, de 15 a 60 é `Última posição`; depois disso o
  backend exclui o marcador. Somente usuários sem `cargo` preenchido aparecem;
  ADMIN, GESTOR, SUB_GESTOR e quaisquer cargos futuros são excluídos no
  servidor. Pontos sobrepostos abrem uma lista.

O resumo nunca devolve coordenadas, pontos GPS ou polylines. O endpoint do mapa
entrega somente origem, destinos e polylines consolidadas da execução solicitada;
segmentos, pontos brutos e coordenadas de confirmação permanecem no backend.

`execucao-rota` é a fonte operacional. `segmento-execucao-rota` guarda lotes de
evidência e não vira uma lista paralela na interface. `historico-visita` é a
consolidação gerada quando houve ao menos um destino confirmado por GPS.

O estado exibido no cartão não substitui `situacaoExecucao`. O backend deriva
um estado operacional para diferenciar rota realmente recebendo leituras,
somente aguardando dados, sem atualização, com sincronização atrasada ou com
destino confirmado e finalização pendente. O detalhe mostra separadamente o
horário da última leitura GPS e o último recebimento no servidor, além da
confiabilidade e das lacunas detectadas. Assim, uma linha tecnicamente “em
andamento” não é apresentada como rastreamento saudável sem evidência recente.

O resultado da viagem é uma classificação separada do status técnico:

- `Percurso confirmado`: ao menos três leituras, todos os destinos e rota
  integral confirmados por GPS;
- `Percurso parcial`: há trajeto e ao menos um destino, sem comprovação integral;
- `Interrompida com trajeto` ou `sem trajeto`: considera a quantidade de
  leituras recebidas;
- `Trajeto sem visita confirmada`: há deslocamento, mas nenhuma chegada GPS;
- `Evidência insuficiente`: encerrada com uma ou nenhuma leitura;
- `Não iniciada`: a navegação foi preparada e cancelada antes do percurso.

Os filtros usam essa leitura operacional. Quantidade de leituras e
confiabilidade permanecem disponíveis no detalhe. A velocidade calculada é
mantida no backend para auditoria, mas não é exibida no painel.

Os campos operacionais são opcionais no contrato móvel. Durante uma publicação
gradual, um backend anterior continua abrindo o painel com o comportamento
legado; apenas não oferece as novas explicações.

Os totais são calculados na primeira página. Ao carregar mais percursos, o
backend devolve somente a nova página e o aplicativo preserva o resumo já
carregado, evitando repetir a agregação de milhares de registros.

## Troca de senha

- ADMIN lista e redefine usuários de qualquer setor;
- GESTOR lista apenas o próprio setor e nunca administra um ADMIN;
- o backend aplica a senha temporária padrão e `deveAlterarSenha=true`;
- a confirmação não exibe nem transporta a senha temporária;
- o audit-log registra usuário afetado e ator administrativo;
- o titular recebe o gate no próximo foreground ou, com o app aberto, em até
  cinco minutos.

## Estrutura

- `models`: contrato do read model;
- `services`: resumo paginado e geometria sob demanda;
- `hooks`: filtros, paginação, concorrência e estados de erro;
- `useCases`: datas e formatação testáveis sem React Native;
- `components`: filtros, resumo, cards e detalhes;
- `screens`: fluxo principal e mapa histórico em tela cheia.

## Permissão no Strapi

No papel real usado pelo usuário móvel, habilite somente:

```text
Painel-admin
├── resumoRotas ✅
├── trajetoRota ✅
├── localizacoesColaboradores ✅
├── listarUsuarios ✅
└── redefinirSenha ✅
```

Não habilite `find` genérico de `execucao-rota`,
`segmento-execucao-rota` ou `historico-visita` para viabilizar o painel. Também
não habilite `Users-permissions User > find/update` para a troca de senha.
Papéis customizados precisam receber essas cinco ações individualmente; a
flag e o cargo continuam sendo revalidados mesmo quando a rota está habilitada.
`listarUsuarios` também alimenta as sugestões do filtro de colaborador, mas uma
falha nessa consulta não impede a pesquisa digitada nem o monitoramento.

## Testes

```bash
yarn typecheck
yarn test:admin
```
