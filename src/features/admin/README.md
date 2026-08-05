# Painel administrativo

Entrada das funções administrativas de monitoramento e redefinição de senha.
A feature não acessa collections genéricas: o resumo de rotas passa por
`GET /api/painel-admin/rotas/resumo` e a geometria de uma única execução por
`GET /api/painel-admin/rotas/:codigoSessao/trajeto`; usuários são consultados
por `GET /api/painel-admin/usuarios` e redefinidos por
`POST /api/painel-admin/usuarios/:usuarioId/redefinir-senha`.

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

A primeira tela contém somente dois acessos: `Monitoramento de rotas` e
`Trocar senha`. Cada módulo possui retorno próprio para essa entrada, mantendo
filtros e estados técnicos fora da navegação global.

## Monitoramento

- **Recorte inicial**: abre em Hoje, com período, pesquisa e situação;
- **Resumo compacto**: apresenta somente os números necessários para entender
  o período sem transformar cada indicador em um cartão;
- **Percursos**: lista resumida, paginação e atualização por gesto;
- **Detalhe**: identificação, horários, planejamento, resultado, qualidade da
  localização, encerramento e destinos planejados;
- **Mapa**: aberto sob demanda para execuções encerradas, compara o trajeto
  real ao planejado e diferencia os destinos confirmados por GPS.

O resumo nunca devolve coordenadas, pontos GPS ou polylines. O endpoint do mapa
entrega somente origem, destinos e polylines consolidadas da execução solicitada;
segmentos, pontos brutos e coordenadas de confirmação permanecem no backend.

`execucao-rota` é a fonte operacional. `segmento-execucao-rota` guarda lotes de
evidência e não vira uma lista paralela na interface. `historico-visita` é a
consolidação gerada quando houve ao menos um destino confirmado por GPS.

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
├── listarUsuarios ✅
└── redefinirSenha ✅
```

Não habilite `find` genérico de `execucao-rota`,
`segmento-execucao-rota` ou `historico-visita` para viabilizar o painel. Também
não habilite `Users-permissions User > find/update` para a troca de senha.
Papéis customizados precisam receber essas quatro ações individualmente; a
flag e o cargo continuam sendo revalidados mesmo quando a rota está habilitada.

## Testes

```bash
yarn typecheck
yarn test:admin
```
