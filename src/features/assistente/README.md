# Assistente global

Módulo opcional de ajuda por voz com arquitetura **local-first**. Comandos
conhecidos continuam instantâneos e independentes de IA. Quando a interpretação
local não reconhece uma frase, o Strapi pode usar uma IA externa apenas para
reescrevê-la em um comando canônico já permitido pelo aplicativo.

## Fluxo seguro

1. o aparelho converte a fala em texto;
2. a árvore local tenta interpretar e executar o comando;
3. somente se ela falhar e `assistenteIaAtiva = true`, o app envia ao Strapi a
   frase e o nome da tela atual;
4. o Strapi monta um contexto mínimo com os módulos liberados para o usuário e
   pede ao provedor apenas um comando canônico, com JSON estruturado;
5. respostas curtas com confiança mínima de 65% voltam ao app;
6. o comando retornado passa novamente pelos interpretadores locais e pelas
   permissões do usuário antes de qualquer ação;
7. timeout, falta de internet, limite do provedor, erro HTTP ou resposta inválida
   usam o fallback local sem bloquear o colaborador.

Após uma falha de rede, novas tentativas externas ficam suspensas por um minuto
para não repetir a mesma espera; comandos locais continuam disponíveis.
Interpretações externas válidas ficam em memória por 15 minutos, limitadas a
100 frases, sem persistência no aparelho.

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
- `useCases`: interpretação e regras puras, testáveis sem Expo;
- `assistenteIaApi`: única porta do app para o fallback do Strapi;
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
`Assistente-ia > interpretar`. Não há nova collection.

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

Os testes cobrem a árvore local, comandos de rota, contexto, busca e rejeição de
respostas de IA com contrato inválido ou baixa confiança.
