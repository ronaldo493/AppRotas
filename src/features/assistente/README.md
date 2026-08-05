# Assistente global

Módulo opcional de ajuda por voz com arquitetura **local-first**. Comandos
conhecidos continuam instantâneos e independentes de IA. Quando a interpretação
local não reconhece uma frase, o Strapi pode usar uma IA externa para classificá-la
em uma intenção estruturada já permitida pelo aplicativo.

## Fluxo seguro

1. o aparelho converte a fala em texto;
2. a árvore local tenta interpretar e executar o comando;
3. somente se ela falhar e `assistenteIaAtiva = true`, o app envia ao Strapi até
   cinco alternativas da fala, a tela, a rota atual e até quatro interações
   recentes sem incluir respostas ou dados consultados;
4. o Strapi monta um contexto mínimo com os módulos liberados para o usuário e
   pede ao provedor uma intenção com domínio, ação e parâmetros tipados;
5. respostas com confiança mínima de 65% voltam ao app; pedidos realmente
   ambíguos podem gerar uma pergunta curta de esclarecimento;
6. o app reconstrói o comando por uma lista fechada e o envia aos mesmos handlers
   locais e verificações de acesso usados pela árvore determinística;
7. timeout, falta de internet, limite do provedor, erro HTTP ou resposta inválida
   usam o fallback local sem bloquear o colaborador.

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

Ambas têm padrão `false`. A IA nunca é montada quando
`assistenteVozAtivo` está desligado. A configuração é atualizada ao abrir o
app, ao voltar ao primeiro plano e a cada cinco minutos. Offline, usa-se a
última decisão conhecida; uma instalação sem cache mantém tudo desligado.

## Organização e fronteiras

- `GlobalSupportAction`: único ponto que escolhe Assistente ou Sugestão;
- `AssistenteFeature`: fronteira pública da feature e de seus providers;
- `AssistenteGlobal`: somente interface e acessibilidade;
- `useAssistenteGlobal`: coordena conversa, permissões e executores;
- `handlers`: casos de filiais, pontos/GPS, contatos, histórico e chamados;
- `formatarDetalhesFilialAssistente`: apresenta fatos do cadastro sem IA;
- `useCases`: interpretação e regras puras, testáveis sem Expo;
- `assistenteIaApi`: única porta do app para o fallback do Strapi e seu cache;
- `metricaAssistenteApi`: envio assíncrono de telemetria sem conteúdo da fala;
- `validarComandoAssistenteIa`: allowlist que reconstrói comandos tipados antes
  de chegarem aos handlers;
- `validarRespostaAssistenteIa`: valida confiança, esclarecimento e o contrato
  de rollout do backend;
- `useReconhecimentoVoz` e `useAssistenteFalante`: adaptadores nativos;
- `RotasContext` e `PontosContext`: contratos dos domínios acionados.

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

O Strapi expõe `POST /api/assistente-ia/interpretar`, autenticado e limitado
pelo middleware de rate limit. Configure somente no backend:

```env
GEMINI_API_KEY=chave_server_side
GEMINI_ASSISTANT_MODEL=gemini-3.1-flash-lite
GEMINI_ASSISTANT_TIMEOUT_MS=3500
```

Modelo e timeout são opcionais; o timeout aceito fica entre 1 e 8 segundos. A
chave não pode usar prefixo `EXPO_PUBLIC_` nem entrar no APK. No papel
`Authenticated`, habilite `Configuracao-app > find` e
`Assistente-ia > interpretar`. Para medir o uso, habilite também
`Metrica-assistente > registrar`; não libere CRUD genérico da collection.

## Métricas de uso

Cada pedido concluído produz no máximo uma métrica, mesmo quando a árvore local
falha e o Gemini é consultado depois. São enviados somente tela, origem
`LOCAL`/`GEMINI`/`ATALHO`, resultado, domínio, ação, tempo percebido e versão do
app. Usuário e setor são associados pelo JWT no backend.

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
```

Os testes cobrem a árvore local, comandos de rota, contexto, busca, detalhes e
continuação de filial, contrato legado, intenção estruturada, esclarecimento e
rejeição de ações inválidas ou de baixa confiança.
