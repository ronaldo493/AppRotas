# Assistente global

Módulo opcional de ajuda por voz com arquitetura **local-first e
server-driven**. Comandos físicos do aparelho continuam instantâneos e
independentes de IA. Consultas factuais podem ser planejadas e resolvidas no
Strapi, permitindo evoluir perguntas de filiais, contatos, pontos, histórico e
monitoramento sem publicar um handler novo no APK.

## Fluxo seguro

1. o aparelho converte a fala em texto;
2. a árvore local tenta interpretar e executar o comando;
3. somente se ela falhar e `assistenteIaAtiva = true`, o app envia ao Strapi até
   cinco alternativas da fala, a tela, a rota atual e até quatro interações
   recentes sem incluir respostas ou dados consultados;
4. o Strapi monta um contexto mínimo com os módulos liberados para o usuário e
   um pré-roteador local seleciona até quatro contratos relevantes;
5. o Strapi monta um prompt apenas com esses domínios e pede ao provedor uma
   intenção com domínio, ação e parâmetros tipados em uma única chamada;
6. respostas com confiança mínima de 65% voltam ao app; pedidos realmente
   ambíguos podem gerar uma pergunta curta de esclarecimento;
7. o app reconstrói o comando por uma lista fechada e o envia aos mesmos handlers
   locais e verificações de acesso usados pela árvore determinística;
8. timeout, falta de internet, limite do provedor, erro HTTP ou resposta inválida
   usam o fallback local sem bloquear o colaborador.

### Protocolo V2 server-driven

Quando `assistenteOrquestradorAtivo = true`, perguntas factuais passam por
`POST /api/assistente-ia/conversar`. Um pré-roteador determinístico resolve os
casos evidentes; somente ambiguidades usam o Gemini como planejador. O modelo
recebe fala, tela, memória estrutural e o catálogo autorizado, mas nenhum
registro de domínio. Depois, uma ferramenta fechada consulta o Strapi e monta a
resposta com os dados reais.

As ferramentas atuais são `filiais`, `contatos`, `pontos`, `historico`,
`monitoramento_rotas` e `ajuda_aplicativo`. A ferramenta administrativa
reutiliza o read model do painel: ADMIN consulta todos os setores, GESTOR apenas
o próprio setor quando liberado e os demais usuários não recebem a ferramenta.
O histórico comum consulta somente o username derivado do JWT.
Consultas da assistente não herdam o período, colaborador ou status selecionados
nos filtros visuais do painel. A mensagem e a memória curta definem a consulta;
o Strapi aplica novamente o escopo autorizado. Por exemplo, “últimas rotas dos
30 dias” consulta 30 dias mesmo que a tela esteja filtrada em hoje.

O app valida novamente protocolo, domínio, blocos, memória e sugestões. A
resposta V2 não possui contrato para executar código ou ação física. Traçar,
adicionar, remover e reordenar destinos, GPS, navegação, tema e confirmações
continuam nos handlers locais. Se o endpoint estiver indisponível, desligado ou
retornar dados inválidos, o fluxo local e `/interpretar` permanecem ativos.

A memória V2 é volátil e guarda somente domínio, termo, colaborador, período e
resultado anterior. Ela é limpa ao trocar de usuário. Sugestões retornadas pelo
backend aparecem antes dos atalhos fixos na mesma faixa horizontal.

Comandos complexos de adicionar, remover e reordenar filiais mantêm um texto
canônico como ponte para o interpretador especializado de rotas. O mesmo campo
permite publicar backend e APK em qualquer ordem durante a transição. Ele não
executa ações diretamente.

Após uma falha de rede, novas tentativas externas ficam suspensas por um minuto
para não repetir a mesma espera; comandos locais continuam disponíveis.
Interpretações externas válidas ficam em memória por 15 minutos, limitadas a
100 combinações de frase e contexto, sem persistência no aparelho. A memória de
conversa também é volátil, limitada a quatro interações e limpa ao trocar de
usuário.

## Informações das filiais

Perguntas factuais usam a collection já carregada de `informacoeslojas`. A
árvore local reconhece código, nome, cidade, bairro ou endereço e pode responder
resumo, endereço completo, telefone, horário de funcionamento, gerente,
supervisor, CNPJ, CEP, bairro, cidade e UF. Exemplos:

- `qual o telefone da filial 25`;
- `que horas fecha a loja 48`;
- `quem é o gerente da filial 35`;
- `me fale tudo sobre a filial 128`;
- depois de uma resposta, `e o endereço dela`.

O handler mantém somente a última filial em memória durante a sessão. Se uma
busca por nome ou cidade resultar em lojas igualmente prováveis, nenhuma é
escolhida automaticamente: a assistente lista as alternativas e pede o código.
Campos ausentes são informados como não cadastrados.

O Gemini pode classificar frases mais livres, mas recebe apenas candidatos com
código, nome e cidade. A resposta é sempre formatada no aparelho a partir do
objeto real da filial; endereço, telefone, horário, gerente, supervisor, CNPJ e
coordenadas não são enviados ao provedor nem completados pela IA.

A IA não executa navegação, não consulta collections e não decide acesso. O
backend consulta os menus autorizados e envia um contexto resumido para ajudar
a reconhecer nomes e entidades reais: cidades e filiais, nomes e departamentos,
descrição/categoria/cidade dos pontos e os registros recentes do próprio
usuário. E-mail, telefone, coordenadas, criador do ponto, JWT, senha e histórico
de outros usuários não entram nesse contexto. A ativação exige avaliação do
contrato e da política de dados do provedor.

## Chaves administrativas

O single type `configuracao-app` possui:

- `assistenteVozAtivo`: liga a assistente global; desligado exibe
  `SugestaoFab`;
- `assistenteIaAtiva`: libera somente o fallback online; desligado mantém toda
  a interpretação local.
- `assistenteOrquestradorAtivo`: libera o protocolo V2 para consultas factuais;
  nasce `false` e pode ser desligado sem remover o fluxo atual;
- `assistenteSugestoesAtivas`: libera somente a apresentação inicial e as dicas
  contextuais temporárias; desligá-la não desativa a assistente.

As quatro têm padrão `false`. A IA nunca é montada quando
`assistenteVozAtivo` está desligado. A configuração é atualizada ao abrir o
app, ao voltar ao primeiro plano e a cada cinco minutos. Offline, usa-se a
última decisão conhecida; uma instalação sem cache mantém tudo desligado.

## Organização e fronteiras

- `GlobalSupportAction`: único ponto que escolhe Assistente ou Sugestão;
- `AssistenteFeature`: fronteira pública da feature e de seus providers;
- `AssistenteGlobal`: somente interface e acessibilidade;
- `adoption`: onboarding, catálogo editorial por tela e limite local de dicas;
- `useAssistenteGlobal`: coordena conversa, permissões e executores;
- `handlers`: casos de filiais, pontos/GPS, contatos, histórico e chamados;
- `formatarDetalhesFilialAssistente`: apresenta fatos do cadastro sem IA;
- `useCases`: interpretação e regras puras, testáveis sem Expo;
- `assistenteIaApi`: única porta do app para o fallback do Strapi e seu cache;
- `assistenteOrquestradorApi`: única porta do protocolo V2, com deduplicação,
  cache curto e fallback nulo;
- `validarRespostaAssistenteOrquestrador`: reconstrói a resposta server-driven
  e elimina campos fora do contrato;
- `deveConsultarOrquestrador`: preserva ações físicas no aparelho;
- `metricaAssistenteApi`: envio assíncrono de telemetria sem conteúdo da fala;
- `validarComandoAssistenteIa`: allowlist que reconstrói comandos tipados antes
  de chegarem aos handlers;
- `validarRespostaAssistenteIa`: valida confiança, esclarecimento e o contrato
  de rollout do backend;
- `useReconhecimentoVoz` e `useAssistenteFalante`: adaptadores nativos;
- `RotasContext` e `PontosContext`: contratos dos domínios acionados.

O botão global pode ser arrastado e conserva sua posição em
`@drogal:assistente-fab-position`. Sugestão e assistente reutilizam o hook
compartilhado `useFloatingActionPosition`, mas possuem chaves independentes;
mover um botão não altera a posição do outro.

Nenhuma tela importa a assistente. Ela usa navegação global e APIs públicas dos
domínios, portanto rotas, pontos, histórico e contatos continuam funcionando
quando a feature está ausente. Para pontos e filiais, o comando termina nos
mesmos fluxos de prévia e confirmação usados pelas telas; a assistente não cria
histórico diretamente.

As sugestões visuais ficam em uma faixa horizontal, usam comandos tipados e não
passam por reconhecimento de texto ou IA. Consultas analíticas de cidades,
departamentos e histórico continuam disponíveis por voz, mas não são carregadas
automaticamente ao abrir o painel.

## Backend e ambiente

O Strapi expõe `POST /api/assistente-ia/interpretar` e
`POST /api/assistente-ia/conversar`, autenticados e limitados pelo middleware
de rate limit. Configure somente no backend:

```env
GEMINI_API_KEY=chave_server_side
GEMINI_ASSISTANT_MODEL=gemini-3.1-flash-lite
GEMINI_ASSISTANT_TIMEOUT_MS=3800
GEMINI_ASSISTANT_CACHE_TTL_MS=600000
```

Modelo, timeout e cache são opcionais; o timeout aceito fica entre 1 e 4,2
segundos para permanecer abaixo do limite do APK publicado. A
chave não pode usar prefixo `EXPO_PUBLIC_` nem entrar no APK. No papel
`Authenticated`, habilite `Configuracao-app > find` e
`Assistente-ia > interpretar` e `Assistente-ia > conversar`. Para medir o uso,
habilite também
`Metrica-assistente > registrar`; não libere CRUD genérico da collection.

## Adoção, texto e áudio

Antes da primeira abertura, `assistenteSugestoesAtivas = true` permite uma dica
geral após quatro segundos. Ela dura sete segundos e aparece no máximo duas
vezes, em dias diferentes. Ao abrir a assistente, a descoberta é encerrada e o
usuário recebe uma apresentação curta com três exemplos clicáveis. Depois
disso, no máximo três telas distintas exibem uma dica contextual por 6,5
segundos. Esse estado é isolado por usuário e versão do aplicativo. As dicas
não leem conteúdo da tela e não bloqueiam toques depois que desaparecem.

A pergunta digitada entra no mesmo coordenador, validações, permissões e
handlers da voz. O microfone só solicita permissão quando tocado. Para
instalações novas, respostas automáticas em voz começam desligadas; a
preferência já salva é preservada e o botão `Ouvir resposta` reproduz apenas a
resposta atual sob demanda.

## Métricas de uso

Cada pedido concluído produz no máximo uma métrica, mesmo quando a árvore local
falha e o Gemini é consultado depois. São enviados somente tela, origem
`LOCAL`/`GEMINI`/`BACKEND`/`ATALHO`, resultado, domínio, ação, tempo percebido e versão do
app. Usuário e setor são associados pelo JWT no backend. Eventos técnicos do
domínio `adocao` distinguem abertura, onboarding, exibição/clique de dica,
clique em exemplo e pergunta digitada/falada. Em conjunto com os resultados já
existentes, isso permite calcular usuários únicos, conversão em pergunta,
sucesso, retorno por dia, domínios utilizados e tempo de resposta.

Transcrição, prompt, resposta, parâmetros, localização e tokens nunca entram no
payload. O envio não é aguardado pela interface, usa timeout curto, não repete e
não mostra toast ou log quando falha. Portanto a assistente permanece funcional
offline ou quando a permissão do endpoint ainda não estiver habilitada.

## Permissão do aparelho

A permissão nativa do microfone é solicitada somente quando o colaborador toca
no microfone. Se negar, atalhos visuais continuam disponíveis. Respostas em
áudio podem ser desligadas localmente sem desativar reconhecimento ou a chave
administrativa. Uma nova build é obrigatória após alterar
`expo-speech-recognition`; Expo Go não representa a instalação final.

## Remoção futura

Para retirar somente a IA online:

1. defina `assistenteIaAtiva = false`;
2. remova `services/assistenteIaApi.ts` e
   `useCases/validarRespostaAssistenteIa.ts`;
3. retire o fallback de `useAssistenteGlobal` e a prop `iaHabilitada`;
4. remova `src/api/assistente-ia`, a variável secreta, a permissão e o campo do
   Strapi após o rollout.

Para retirar somente o protocolo V2, defina
`assistenteOrquestradorAtivo = false`, remova `assistenteOrquestradorApi`, os
modelos/validadores V2 e a prop `orquestradorHabilitado`. O interpretador local
e o endpoint legado continuam funcionando.

Para retirar toda a assistente:

1. faça `GlobalSupportAction` retornar apenas `<SugestaoFab />`;
2. remova `features/assistente` e `tests/assistant.test.cjs`;
3. remova `expo-speech`, `expo-speech-recognition` e o plugin do
   `app.json`;
4. mantenha `RotasContext` e `PontosContext`: são contratos dos próprios
   domínios.

## Validação

```bash
npm run typecheck
npm run test:assistant
npm run test:assistant-v2
```

Os testes cobrem a árvore local, comandos de rota, contexto, busca, detalhes e
continuação de filial, contrato legado, intenção estruturada, esclarecimento e
rejeição de ações inválidas ou de baixa confiança.
