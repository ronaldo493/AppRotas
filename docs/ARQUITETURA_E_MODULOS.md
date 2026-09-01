# Arquitetura e módulos do aplicativo

Referência técnica do aplicativo Expo/React Native. O objetivo é explicar onde
cada responsabilidade reside, como os fluxos se conectam e quais invariantes
devem ser preservadas durante manutenção.

## 1. Tecnologias e execução

- Expo 54, React Native 0.81 e React 19;
- TypeScript com verificação por `tsc --noEmit`;
- React Navigation: auth, stack, drawer e tabs;
- React Native Paper: tema e componentes;
- Axios com timeout padrão de 15 segundos e política global de retry;
- AsyncStorage: sessão, preferências e caches de contingência;
- Expo SQLite: execução de rota e pontos de GPS;
- Expo Location/Task Manager: localização em primeiro e segundo plano;
- React Native Maps e Supercluster: mapas e agrupamento;
- EAS Build: development build, preview e produção.

Comandos principais:

```bash
yarn install
yarn start-lan
yarn typecheck
yarn test:all
yarn build-android
```

`yarn start-lan` inicia o Metro e limpa o cache. O aviso do Expo pedindo para
instalar outra versão geralmente indica que o comando foi executado fora da
pasta `ReactNative` ou que as dependências ainda não foram instaladas.

## 2. Organização das pastas

```text
src/
├── application/       composição, providers e navegação
├── core/              capacidades transversais independentes de tela
│   ├── api/           cliente Strapi e tipos HTTP
│   ├── auth/          sessão, JWT e primeiro acesso
│   ├── config/        ambiente
│   ├── location/      localização compartilhada
│   ├── metrics/       resumo diário de uso e contingência offline
│   ├── menu/          tipos de menu
│   └── theme/         tema claro/escuro
├── features/          módulos de negócio
└── shared/            componentes e utilitários reutilizáveis
```

Dentro de uma feature, use conforme a complexidade:

- `screens/`: orquestra UI e navegação;
- `components/`: componentes visuais menores;
- `hooks/`: estado e integração React;
- `useCases/`: regras de negócio e coordenação;
- `services/`: HTTP, banco, SO e integrações;
- `models/`: contratos e tipos do domínio;
- `*.styles.ts`: estilos separados da lógica.

Uma tela não deve conhecer SQL ou formato interno do Strapi. Um service não
deve renderizar Toast ou navegar. Use cases devem ser testáveis sem montar UI.

## 3. Árvore de providers

```text
AuthProvider
└── ThemeProvider
    └── PaperProvider
        ├── DeviceSessionMonitor
        ├── DeviceLocationPresenceMonitor
        ├── AppUsageMonitor
        ├── ForcedPasswordChangeGate
        │   └── ExecucaoRotaProvider
        │       └── SessionDataProviders (key por usuário)
        │           └── FiliaisProvider
        │               └── RotasProvider
        │                   └── PontosProvider
        │                       └── HistoricoProvider
        │                           └── LocationProvider
        │                               ├── AppVersionChecker
        │                               ├── AppNavigation
        │                               └── LocalizacaoRotaGuard
        └── AppToast
```

Decisões importantes:

- `AuthProvider` fica no topo porque cliente HTTP, gates e navegação dependem da
  sessão;
- `ForcedPasswordChangeGate` impede montar a aplicação autenticada quando a
  senha temporária ainda está ativa;
- `SessionDataProviders` recebe uma `key` derivada do usuário e remonta na troca
  de identidade;
- `ExecucaoRotaProvider` fica acima desse limite para preservar e finalizar com
  segurança a execução do proprietário anterior;
- `DeviceSessionMonitor` e `DeviceLocationPresenceMonitor` observam o ciclo de
  vida sem bloquear a restauração offline; presença é diagnóstico de sessão e
  não é usada como marcador fora de uma rota;
- Patrimônio não tem provider global: seu estado é local ao fluxo e ao arquivo.
- `AppUsageMonitor` consolida aberturas e tempo em primeiro plano por dia,
  mantém até 14 dias locais quando offline e não coleta tela, fala ou localização.

## 4. Navegação

`AppNavigation` escolhe `AuthNavigator` ou `MainStackNavigator` conforme a
sessão. O tema do React Navigation deriva do mesmo tema do Paper.

Menus dinâmicos não importam telas diretamente. O registro central
`application/navigation/menuRegistry.ts` converte a rota técnica do Strapi em
componente. O registro é a lista de compatibilidade desta versão:

```text
Home, MapaLojas, Historico, Pontos,
Patrimonio, Contatos, Admin
```

`resolveMenuNavigation` filtra inativos, ordena, descarta rota desconhecida e
deduplica por rota técnica. Para adicionar um módulo:

1. criar a feature e a tela de entrada;
2. registrar uma rota técnica estável no `menuRegistry`;
3. atualizar os tipos da navegação;
4. cadastrar e publicar o mesmo valor no campo `menu.rota` do Strapi;
5. relacionar o menu aos setores e testar `/menus/me`.

O módulo Patrimônio usa `Patrimonio` no menu e `PatrimonioRegistro` somente no
stack interno. Não reutilize o mesmo nome em navegadores aninhados.

## 5. API e tratamento de erros

`core/api/strapiClient` centraliza URL base, JWT, timeout e retries. A URL vem de
`EXPO_PUBLIC_STRAPI_URL`, tem somente a barra final removida e deve incluir o
prefixo `/api` (por exemplo, `https://rotas.drogal.com.br/api`).

Regras:

- hooks e services podem definir timeout/retry mais restritos em operações
  sensíveis;
- respostas Strapi v4/v5 são normalizadas pelos modelos/helpers;
- erro recuperável deve gerar estado ou Toast amigável;
- `appLogger` envia console somente quando `__DEV__` é verdadeiro;
- não use `console.error` diretamente em features;
- falhas auxiliares, como sessão e auditoria, não anulam a ação principal já
  confirmada.

## 6. Autenticação e sessão

`AuthContext` mantém `token`, `user`, carregamento e logout. Persistências:

| Chave | Conteúdo |
| --- | --- |
| `userToken` | JWT do Users & Permissions |
| `userData` | usuário e menus válidos |
| `deviceSession` | código opaco e metadados mínimos da sessão do aparelho |
| `appInstallationId` | identificador aleatório da instalação; não contém dado de hardware |
| `theme` | `dark` ou `light` |

O JWT é decodificado apenas para validar expiração; autorização continua sendo
responsabilidade do backend. Token inválido/expirado remove a sessão. O app
agenda logout para o `exp` e revalida ao voltar ao foreground.

No login, o JWT ainda não foi publicado no contexto. Por isso `useAuth` o envia
explicitamente ao registrar `/sessoes-dispositivo` e buscar `/menus/me`. O
`DeviceSessionMonitor` valida a sessão
no foreground e periodicamente sem bloquear a restauração offline. Respostas de
revogação passam pelo coordenador de encerramento para preservar a fila de rota.

Reautenticação na mesma instalação
renova a sessão; somente outra instalação é descrita como “outro aparelho”.
Expiração, encerramento administrativo e sessão inválida possuem mensagens
próprias.

### Primeiro acesso

`core/auth/forcedPasswordChange` contém service, hook, gate e estilos. O hook
consulta o status autoritativo no backend e persiste a decisão booleana no
perfil local. Na restauração offline, `false` libera imediatamente a aplicação
e `true` mantém o gate obrigatório; valor ausente ou inválido permanece em
verificação e nunca libera silenciosamente. A revalidação remota usa timeout
curto, sem retries, e não bloqueia um perfil local já autorizado. O gate possui
estados `checking`, `required`, `allowed` e `error`.

Remover o wrapper de `AppProviders.tsx` desativa o fluxo sem criar dependência
nas demais features. Não duplique a regra dentro das telas.

## 7. Menus em sessão

`features/menus` consulta somente `/menus/me`. O cache de carregamento recente é
em memória e separado pela chave estável do usuário. `useMenuAccessSync`:

- evita uma consulta imediatamente após o login;
- atualiza ao retornar ao foreground;
- atualiza a cada cinco minutos enquanto ativo;
- aplica cooldown de 30 segundos;
- preserva menus atuais em falha ou resposta fora do contrato.

O app não refaz regras de cargo/setor; apenas valida o contrato e as rotas que
esta versão sabe montar.

## 8. Localização compartilhada

`LocationProvider` fornece localização às telas. Registros persistidos não
usam diretamente `currentCity`, pois esse estado visual pode representar uma
leitura anterior. O serviço `locationSnapshotService` captura uma posição e
resolve a cidade usando exatamente aquelas coordenadas.

Para resolver uma cidade associada a uma coordenada:

1. tenta última posição conhecida com no máximo 60 segundos e 250 metros de
   precisão;
2. quando necessário, solicita uma posição atual balanceada;
3. faz geocodificação reversa;
4. armazena cache por coordenada arredondada a três casas.

No início de uma execução, cidade e coordenadas formam um snapshot único. Falha
ou tempo limite da geocodificação grava cidade nula, mas não invalida o GPS,
não impede o login e não interrompe a rota. As telas de Rotas e Pontos não podem
fornecer manualmente `cidadeOrigem` ao caso de uso.

Negar localização não impede o login. Já uma rota monitorada exige permissão em
uso, permissão de segundo plano e serviço do aparelho habilitado. Mensagens de
bloqueio devem oferecer abertura das configurações.

## 9. Módulos

### 9.1 `rotas`

Mantém lista ordenável de destinos, pesquisa de filial e prévia. Responsabilidades:

- aceitar código numérico exato da filial;
- impedir destinos inválidos/duplicados conforme o use case;
- permitir reordenar antes da consulta;
- consultar configuração do monitoramento;
- chamar a prévia apenas em **Traçar rota**;
- permitir que a assistente calcule a mesma prévia sem abrir o mapa e prossiga
  para o navegador solicitado/preferido;
- abrir Google Maps/Waze diretamente se a chave estiver desativada;
- delegar início e rastreamento a `execucaoRota`.

`routePreviewService` envia origem e destinos ao backend. No momento da prévia,
o aplicativo aproveita o snapshot do contexto ou a última leitura nativa
somente quando ela tem até 30 segundos e precisão de até 100 metros. Fora
desses limites, uma posição atual é solicitada antes da consulta. Isso evita
esperar uma segunda leitura do GPS quando a origem já é confiável sem aceitar
silenciosamente uma posição antiga. A preparação começa quando existe um
destino e a leitura em andamento é deduplicada com a abertura da prévia. O
cache usa identidade, ordem e coordenadas dos destinos, expira após 10 minutos
e só é válido até 500 metros da origem anterior. Alterar lista, ordem ou origem
além desse limite exige nova estimativa. A polyline recebida é decodificada para
desenho no mapa.

A pesquisa numérica da tela de Rotas possui um fallback persistente exclusivo.
Depois de uma leitura online válida de `/informacoeslojas`, a lista é salva no
AsyncStorage com versão, servidor e chave estável do usuário. Enquanto a API é
consultada, a última lista válida pode atender a pesquisa; falhas transitórias
mantêm esse fallback, mas respostas `401` e `403` o bloqueiam. O mapa de lojas,
o assistente e os demais módulos não consomem esse cache.

O fallback garante a seleção e ordenação dos destinos. A prévia com distância e
tempo continua dependendo da Routes API; quando indisponível, o fluxo existente
permite continuar sem prévia. A navegação final depende dos recursos offline do
Google Maps/Waze instalados no aparelho.

O comando assistido usa exatamente os códigos pronunciados e não mistura
paradas antigas. A preferência de navegador é local, isolada por usuário e só
é atualizada depois que a abertura foi concluída. Sem histórico, a escolha
continua explícita. Mais de um destino força Google Maps para não descartar
paradas intermediárias. Viagem ativa continua passando pelo fluxo seguro de
interrupção antes da substituição.

### 9.2 `execucaoRota`

É o módulo de maior criticidade. Ele não depende da tela nem do navegador de
navegação. Suas camadas são:

- models: execução, destino, ponto, evento e resumo;
- use cases: preparar, atualizar, finalizar e sincronizar;
- services: banco, mappers, tarefa de background, API e configuração;
- context: ciclo de vida, sincronização, restauração e estado React;
- guard: saúde da localização durante execução ativa.

Banco `drogal-route-monitoring.db`:

| Tabela | Uso |
| --- | --- |
| `route_executions` | planejamento, proprietário, status, sincronização e resumo |
| `route_tracking_points` | sequência de pontos GPS |
| `route_destination_progress` | leituras e confirmação por destino |
| `route_location_events` | interrupções e recuperação de localização |

O banco habilita foreign keys, WAL e `busy_timeout = 5000`. Há índice único
para uma execução ativa. Toda mutação passa pela fila de escrita; não crie uma
segunda conexão/escrita direta dentro de componentes.

`route_executions.device_session_code` mantém a sessão que iniciou a viagem.
Esse valor não é removido no logout e permite reconciliar uma rota pendente com
a sessão antiga autorizada apenas para sincronização.

A tarefa `drogal-route-location-tracking` usa `BestForNavigation`, 20 m, 10 s e
deferimento de 50 m/30 s. No Android, mantém foreground service durante a rota.
Cada entrega primeiro entra no SQLite e, em seguida, faz uma tentativa curta de
sincronização sem depender de componentes React. Portanto, abrir Maps ou Waze
não interrompe o envio ao Strapi. Se a rede falhar, o ponto continua pendente e
será reenviado pela próxima entrega, ao voltar ao aplicativo ou pelo ciclo de
sincronização em primeiro plano.

O app publica um estado técnico mínimo em
`POST /execucoes-rotas/:codigoSessao/telemetria`. Os eventos distinguem início e
confirmação do serviço, localização recebida, GPS indisponível, permissão
removida, serviço interrompido, retorno ao foreground, sincronização pendente e
lote enviado. O envio contém horário e quantidade de pontos pendentes, não
coordenadas. É best-effort: falhar nessa chamada não altera a integridade do
SQLite, dos segmentos ou da finalização.

Sincronização:

- somente dados do proprietário autenticado;
- mesma sessão de aparelho que iniciou a execução na tarefa em segundo plano;
- início antes dos lotes;
- lotes de até 100 pontos com `codigoLote` único;
- finalização somente após os dados necessários;
- idempotência por `codigoSessao` e `codigoLote`;
- chamadas concorrentes são serializadas por usuário;
- backoff progressivo após falha;
- pendências sobrevivem a reinício e falta de rede.

### 9.3 `admin`

É a entrada de três funções independentes: `Monitoramento de rotas`, `Rotas em
andamento` e `Trocar senha`. Administradores recebem todos os setores; gestores são limitados pelo
backend ao próprio setor e só entram no rollout quando
`configuracao-app.painelAdminGestoresAtivo` está ativa. A mesma política filtra
`/menus/me` e protege os endpoints administrativos. A feature separa modelos,
serviços HTTP, hooks, casos de uso puros, componentes e telas.

O fluxo principal consolida execuções e históricos, permite buscar, filtrar e
abrir detalhes sem receber geometrias. Somente ao solicitar o mapa, a segunda
rota devolve origem, destinos e polylines consolidadas daquela execução. Pontos
GPS e segmentos brutos não chegam ao aplicativo. O painel permanece somente
leitura e não reutiliza os contextos destinados ao colaborador em rota. A tela
começa em `Hoje`, destaca estado operacional e usa a última localização apenas
como evidência de atualização da execução.

`Rotas em andamento` é liberado separadamente por
`configuracao-app.mapaRotasEmAndamentoAtivo`. O mapa geral consulta uma única
posição consolidada por execução ativa e nunca usa a presença global como
marcador. Usuários com qualquer `cargo` ficam fora da equipe exibida. O mapa
detalhado continua disponível pelo monitoramento independentemente dessa flag.

O status persistido e o resultado comprovado são conceitos diferentes. O
backend classifica os registros em confirmado, parcial, interrompido com/sem
trajeto, trajeto sem visita, evidência insuficiente e não iniciado. Os filtros
usam essa classificação; detalhes mostram leituras, confiança, sincronização e
o último estado técnico do rastreamento. A velocidade derivada permanece no
backend para auditoria de anomalias, mas não é exibida na interface.

A gestão de senha usa `GET /painel-admin/usuarios` e
`POST /painel-admin/usuarios/:usuarioId/redefinir-senha`. O app não envia setor, cargo
ou senha temporária e não recebe hashes. O servidor redefine para o padrão de
primeiro acesso, marca `deveAlterarSenha=true` e audita ator e usuário afetado.

### 9.4 `historico`

Consulta o histórico definitivo em páginas. O backend deve filtrar/expor apenas
o escopo apropriado ao usuário conforme permissões do ambiente.
Novos históricos são produzidos somente pela consolidação idempotente da
execução monitorada no backend; o aplicativo não envia histórico diretamente.

### 9.5 `filiais`

Carrega `/informacoeslojas` em páginas de 100. Deduplica requisições concorrentes
por token e compartilha o resultado no contexto. Coordenadas inválidas não são
enviadas ao mapa. A localização inicial usa usuário, depois Piracicaba ou a
primeira filial válida como fallback.

O mapa calcula localmente a distribuição das filiais válidas por cidade e UF,
sem endpoint adicional. Códigos repetidos contam uma única vez. O painel mostra
ranking, quantidade e proporção; selecionar uma linha filtra os marcadores e
enquadra o grupo. Pesquisa textual e filtro analítico não ficam ativos juntos,
evitando um recorte invisível para o usuário.

### 9.6 `pontos`

Carrega e cria `/pontos-interesses`. Modela campos opcionais para compatibilidade
com registros antigos: `usernameCriador`, `cidadePonto` e `setorCriador`.

No novo cadastro, cidade é resolvida pela coordenada; falha vira `Não informado`.
O hook envia dados do usuário, mas o backend autentica e sobrescreve autoria.
Criar não chama histórico. Traçar para o ponto reaproveita os módulos `rotas` e
`execucaoRota`.

Registros separados que estejam em um raio de 12 metros são representados por
um único local numerado. Ao tocar, o usuário escolhe o restaurante ou posto que
deseja usar. Essa consolidação acontece antes do Supercluster, somente quando a
lista muda, e não altera nem combina os registros persistidos no Strapi.

### 9.7 `contatos`

Carrega páginas de 100, remove duplicidade por identidade dos campos, ordena e
filtra em memória. A tela usa FlatList e componentes memoizados para reduzir o
custo de listas grandes.

### 9.8 `configuracoes`

Perfil atualiza apenas `emailSec` e senha. Cargo e e-mail corporativo principal
permanecem somente leitura. As alterações usam `/perfil/email` e
`/perfil/senha`, que derivam o usuário do JWT e geram audit log no backend;
o app não recebe permissão genérica para editar usuários ou criar auditoria.
Cargo e e-mail corporativo principal não são editados pela tela, e a auditoria
nunca recebe valores sensíveis.

### 9.9 `atualizacao`

Consulta `update-app` ao montar, inclusive deslogado. Com versão remota superior,
exibe modal não dispensável. O campo remoto `required` não participa da decisão
atual.

### 9.10 `sugestoes`

Envia uma sugestão e persiste apenas a posição do FAB em
`@drogal:sugestao-fab-position`. Erro de envio mantém o formulário para nova
tentativa.

### 9.11 `patrimonio`

Fluxo local descrito em `src/features/patrimonio/README.md`. O formulário
registra ambientes e equipamentos, persiste `patrimonio.json` com debounce de
300 ms e compartilha por WhatsApp. Não depende do Strapi e não entra em
`AppDataProviders`.

### 9.12 `assistente`

Módulo opcional controlado por `configuracao-app.assistenteVozAtivo`. O
componente `GlobalSupportAction` é o único ponto de composição: monta a
assistente quando a flag é `true` e `SugestaoFab` nos demais casos.

As duas ações flutuantes usam `shared/hooks/useFloatingActionPosition`. A
assistente persiste `@drogal:assistente-fab-position` e a sugestão mantém sua
própria chave, evitando acoplamento de estado entre os módulos.

Reconhecimento, resposta falada, preferências e árvore de intenções ficam
encapsulados na feature. A permissão do microfone é solicitada somente ao tocar
no controle de voz. Rotas e pontos são delegados aos contratos públicos dos
respectivos domínios e percorrem os mesmos handlers das telas.

O coordenador distribui filiais, pontos/GPS, contatos e histórico
para hooks em `features/assistente/handlers`. A tela de Rotas conhece somente o
adaptador opcional `integrations/rotas/RouteAssistantMic`, que publica um evento
no gateway; ela não conhece reconhecimento, conversa ou orquestrador.
O fluxo híbrido diferencia ações físicas de perguntas factuais: uma pergunta
factual reconhecida tenta primeiro o V2; os demais comandos tentam primeiro a
árvore local. Se ainda não houver resposta, o coordenador tenta o V2 quando ele
ainda não foi consultado.

Com `assistenteOrquestradorAtivo`, perguntas factuais usam o protocolo V2 em
`assistenteOrquestradorApi`. O backend planeja uma ferramenta fechada, reaplica
menus/escopo e calcula a resposta. O cliente apenas valida/apresenta texto e
sugestões; comandos físicos permanecem nos handlers locais. Essa integração
continua restrita a `GlobalSupportAction`/`AssistenteFeature`, portanto nenhuma
tela conhece o módulo e sua remoção não altera os domínios.

No protocolo server-driven, o Gemini pode apenas sugerir um plano; o Strapi
valida e decide a ferramenta. A flag `assistenteIaAtiva` libera o planejador,
mas o pré-roteador determinístico e as ferramentas continuam funcionando sem
ela.

O V2 também concentra no backend a memória autoritativa por usuário e sessão,
a base de conhecimento versionada e as análises administrativas. Cada pergunta
revalida menus, cargo, setor e entidades. A tela atual serve apenas para
desambiguar perguntas genéricas e não limita a consulta aos filtros visuais.

Uma ambiguidade não é tratada como erro nem resolvida pelo primeiro resultado.
O contrato guarda temporariamente a ferramenta, a ação, o parâmetro, os filtros
e opções sanitizadas. O app apresenta essas opções como sugestões e força a
continuação seguinte pelo orquestrador. A seleção é novamente resolvida dentro
do setor e das permissões atuais. A memória validada enviada pelo cliente também
permite continuidade após reinício do processo Strapi, sem transportar
autorização.

O monitoramento server-driven fornece comparações entre colaboradores e períodos,
diagnósticos e rankings operacionais. O React Native não recalcula métricas nem
herda os filtros visuais do painel: ele apenas valida e apresenta a resposta do
read model autorizado.
Essas capacidades podem evoluir sem APK enquanto o contrato V2 continuar
compatível.

`metricaAssistenteApi` é uma saída secundária resiliente. O cliente correlaciona
adoção, entrada e resposta por `codigoInteracao`; o backend grava a execução do
orquestrador como fonte de verdade, distinguindo árvore local, pré-roteador,
Gemini e ferramenta. A fila local de até 100 eventos, isolada por usuário e com
retenção de sete dias, cobre falhas de rede sem bloquear a conversa. O payload
não contém fala, resposta ou parâmetros.

O procedimento de remoção está em
[`src/features/assistente/README.md`](../src/features/assistente/README.md).

## 10. Tema e renderização

Todas as telas devem usar `useAppTheme` e cores semânticas. Não fixe branco ou
preto para superfícies/textos. Sheets e modais precisam receber o tema e
considerar teclado com `KeyboardAvoidingView`/layout `resize`.

Para listas e mapas:

- memoizar `renderItem`, filtros e componentes repetidos;
- usar chaves estáveis, nunca índice quando houver identidade;
- evitar atualizar o contexto com o mesmo conjunto;
- construir o índice Supercluster somente quando os dados mudarem;
- não renderizar todos os markers fora da região útil;
- evitar objetos de estilo novos dentro de listas quando puderem ser estáticos.

## 11. Ambiente e builds

`.env.local`:

```env
EXPO_PUBLIC_STRAPI_URL=https://servidor/api
GOOGLE_MAPS_API_KEY=chave_nativa_restrita
ALLOW_CLEARTEXT_TRAFFIC=false
```

`GOOGLE_MAPS_API_KEY` é incorporada ao binário pelo `app.config.ts` e deve ser
restrita pelo package/bundle, assinatura e APIs nativas. A chave do Google
Routes fica somente no Strapi.

Perfis EAS:

| Perfil | Uso |
| --- | --- |
| `development` | dev client com módulos nativos e background location |
| `preview_android` | APK interno para homologação |
| `preview` | distribuição interna padrão |
| `production` | distribuição final com auto incremento |

Expo Go não valida adequadamente background location nem todos os módulos
nativos. Antes de produção, teste em development build/APK físico.

## 12. Testes

```bash
yarn typecheck
yarn test:all
```

Os scripts seletivos, como `yarn test:route-execution`,
`yarn test:route-preview`, `yarn test:device-session` e
`yarn test:patrimonio`, continuam úteis durante o desenvolvimento. A liberação
deve executar a suíte completa declarada no `package.json`, sem depender de uma
contagem fixa de casos.

Cobertura de domínio inclui patrimônio, preparação/consolidação local da rota,
prévia/cache, resiliência de banco/sincronização e primeiro acesso. Testes de
unidade não substituem os cenários físicos:

- negar e reativar permissões;
- bloquear GPS no meio da rota;
- perder e recuperar internet;
- deixar em background e encerrar o processo;
- trocar de usuário com pendências;
- selecionar um, vários e parte dos destinos;
- abrir somente a prévia sem iniciar;
- testar Maps e Waze instalados/não instalados;
- tema claro/escuro, teclado e listas grandes.

## 13. Regras para evolução

- Novo endpoint deve entrar em um service, não diretamente em uma tela.
- Nova regra com ramificações deve entrar em use case e receber teste.
- Dados globais só entram em provider se mais de uma árvore realmente precisar.
- Estado ligado à identidade deve estar sob `SessionDataProviders` ou possuir
  segregação explícita por proprietário.
- Persistência offline deve ter versionamento, migração e idempotência.
- Alterar campo/enum do Strapi exige atualizar modelo, documentação e teste.
- Não transforme a prévia em histórico; intenção e execução são eventos
  diferentes.
- Nunca inclua senha, token, e-mail completo ou localização detalhada em logs de
  console/auditoria sem uma finalidade e política aprovadas.
