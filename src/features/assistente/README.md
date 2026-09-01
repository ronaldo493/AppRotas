# Assistente do aplicativo

Módulo opcional e desacoplado das telas. Ele recebe voz, texto ou atalhos,
decide se o pedido pode ser resolvido localmente ou pelo Strapi e apresenta a
resposta sem conceder autoridade ao Gemini.

## Composição

`application/components/GlobalSupportAction.tsx` é o único ponto de entrada:

- `assistenteVozAtivo=true`: monta `AssistenteFeature`;
- `assistenteVozAtivo=false`: monta a bolinha de sugestões;
- `assistenteSugestoesAtivas=true`: permite dicas contextuais temporárias;
- `assistenteOrquestradorAtivo=true`: permite consultas server-driven;
- `assistenteIaAtiva=true`: o backend pode usar Gemini como planejador.

O aplicativo não recebe nem armazena `GEMINI_API_KEY`. A flag de IA é aplicada
exclusivamente pelo backend; o cliente conhece apenas a disponibilidade do
orquestrador.

## Fluxo de uma pergunta

1. `AssistenteGlobal` recebe voz, texto ou atalho.
2. Frases factuais ou administrativas são encaminhadas primeiro a
   `POST /api/assistente-ia/conversar` quando o orquestrador está ativo.
3. Comandos físicos e preferências tentam primeiro a árvore local:
   - montar, limpar ou reorganizar uma rota;
   - encontrar ponto próximo e preparar navegação;
   - abrir telas autorizadas;
   - alterar tema e preferência de voz;
   - consultar dados já disponíveis localmente.
4. Se a árvore local não resolver e o orquestrador ainda não tiver sido
   consultado, o pedido é enviado ao endpoint server-driven.
5. Sem resultado, o app mantém o fluxo local de rotas e responde que não
   compreendeu.

Na tela de Rotas, o adaptador opcional `integrations/rotas/RouteAssistantMic`
abre a mesma captura global. Um pedido como “trace uma rota para 25, 35 e 48”
substitui a seleção anterior pela ordem pronunciada, calcula a estimativa sem
abrir o mapa de prévia, informa tempo/distância e abre o navegador. O navegador
explicitamente pedido tem prioridade; sem pedido, o app reutiliza o mais usado.
Na primeira utilização ainda pergunta qual usar. Rotas com várias paradas usam
Google Maps, porque o fluxo externo do Waze recebe somente o destino final.

Uma execução ativa nunca é interrompida silenciosamente: o diálogo de troca
continua obrigatório. Se o monitoramento estiver desligado no Strapi, não há
consulta à Routes API nem GPS em segundo plano; somente o navegador é aberto.

O Gemini nunca executa uma ferramenta. Ele pode sugerir intenção, ação e
parâmetros; o Strapi valida o plano, as permissões, o setor, as entidades e a
ferramenta registrada antes de consultar qualquer dado.

## Memória curta

O backend devolve uma memória semântica limitada, que pode guardar referências
resolvidas como colaboradores comparados, filial, período, filtro e última
intenção. O app envia essa memória na continuação seguinte e substitui pelo valor
devolvido pelo servidor.

Quando existem opções homônimas, a resposta inclui uma pendência estruturada.
As opções aparecem primeiro nas sugestões clicáveis e o próximo texto ou áudio é
encaminhado diretamente ao orquestrador. “O segundo”, “João Silva” ou o clique no
nome retomam a ação, o período e os filtros anteriores. A entidade ainda é
revalidada no backend.

Cada pergunta reaplica autorização. Memória ajuda a interpretar expressões como
“ele”, “ontem” ou “só as interrompidas”, mas nunca transporta uma permissão
anterior.

Ao trocar de usuário, a memória e as sugestões dinâmicas são apagadas. Nenhuma
resposta, telefone, e-mail ou coordenada é persistida pelo cliente.

## Fallbacks

São situações diferentes:

- Gemini indisponível: pré-roteador e ferramentas determinísticas do Strapi
  continuam disponíveis;
- orquestrador desligado ou Strapi indisponível: comandos locais e dados já
  carregados/cacheados continuam disponíveis;
- sem internet: apenas capacidades realmente locais funcionam.

O timeout, erro do provedor ou falha de métrica nunca deve bloquear a interface.

## Organização

```text
assistente/
├── components/       # interface flutuante e composição interna
├── context/          # preferência de resposta falada
├── handlers/         # adaptadores para filiais, pontos, contatos e histórico
├── hooks/            # coordenação, voz, fala e adoção
├── integrations/     # adaptadores opcionais e removíveis nas telas
├── models/           # contratos locais e do orquestrador
├── services/         # configuração, conversa V2 e métricas
└── useCases/         # interpretação local, busca, ranking e validação
```

Os handlers usam contratos públicos dos domínios. A única integração visual de
tela é o adaptador do microfone da busca de rotas, ligado por um gateway de
eventos e sem acessar estado interno da assistente. Removê-lo exige apagar uma
importação e a propriedade `trailingAction`; rotas, GPS, histórico e contatos
continuam funcionando.

## Permissões e dados

O endpoint `/assistente-ia/conversar` exige JWT e sessão de dispositivo válida.

O microfone integrado à busca de rotas inicia uma captura compacta: mostra
somente `Escutando…`/`Entendendo…`, sem abrir o painel completo. Quando o pedido
inclui traçar uma rota, tempo, distância e abertura do navegador recebem
feedback falado pontual, mesmo que as respostas automáticas estejam desligadas.
O Strapi reaplica:

- menus permitidos;
- cargo ADMIN ou GESTOR quando necessário;
- setor do gestor;
- acesso à entidade resolvida;
- allowlist de ferramentas e ações somente leitura.

A tela atual é apenas contexto de desambiguação. Filtros visuais selecionados no
painel não limitam uma pergunta como “resuma as rotas dos últimos 30 dias”.

Consultas administrativas suportam resumo, diagnóstico, comparação entre duas
pessoas, comparação com período anterior e rankings por interrupção, problema,
tempo sem atualização, rotas em andamento, duração ou distância. Os valores são
calculados pelo read model do painel dentro do escopo permitido; o Gemini apenas
pode sugerir o plano.

## Métricas

`metricaAssistenteApi` envia eventos sem texto da pergunta, resposta ou
parâmetros. Falhas transitórias ficam em uma fila local limitada, idempotente,
isolada por usuário e com retenção de sete dias. As métricas diferenciam:

- exposição da bolinha/dica;
- abertura da assistente;
- entrada por voz, texto ou atalho;
- origem local, backend ou Gemini;
- sucesso técnico de resultado de negócio;
- encontrado, sem resultado, ambíguo, não compreendido e indisponível;
- domínio, ferramenta, ação e tempo de resposta.

`codigoInteracao` correlaciona entrada, resposta no aparelho e orquestração no
servidor. O Strapi registra separadamente pré-roteador, Gemini e ferramenta,
incluindo latência, modelo e contagem de tokens quando houver chamada de IA.

Falha na métrica não altera o resultado da conversa.

## Evolução segura

Antes de adicionar um comando:

1. definir a intenção e o domínio responsável;
2. implementar a regra local ou uma ferramenta server-driven;
3. validar parâmetros e política no Strapi;
4. adicionar frases reais aos evals;
5. testar ambiguidades, ausência de permissão e Gemini indisponível;
6. atualizar esta documentação e a documentação do backend.

Comandos que modificam dados, iniciam GPS ou abrem navegação devem continuar no
aplicativo e exigir confirmação quando houver efeito relevante.

## Testes

No aplicativo:

```bash
yarn test:assistant
yarn test:assistant-v2
yarn test:assistant-adoption
yarn typecheck
```

No Strapi, execute `yarn test:domain` ou `yarn test:assistant-evals`. A suíte
atual contém 130 frases reais. Os evals do backend validam pré-roteador,
planejador, memória, desambiguação, políticas e ferramentas sem depender de uma
resposta livre do modelo.
