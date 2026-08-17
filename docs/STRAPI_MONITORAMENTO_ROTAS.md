# Contrato do Strapi para monitoramento de rotas

Este documento descreve o contrato esperado pelo aplicativo para registrar
uma viagem real enquanto Google Maps ou Waze permanece aberto. A estrutura
considera Strapi 5, sem Draft & Publish e sem internacionalização.

## 1. Collection `execucao-rota`

Crie uma Collection Type com:

- Display name: `Execução de rota`
- API ID singular: `execucao-rota`
- API ID plural: `execucoes-rotas`
- Draft & Publish: desativado

| Campo | Tipo no Strapi | Configuração |
| --- | --- | --- |
| `codigoSessao` | Text (Short text) | obrigatório e único |
| `usuario` | Relation | many-to-one com User (Users & Permissions), obrigatório |
| `username` | Text (Short text) | obrigatório; preenchido pelo backend |
| `setor` | Text (Short text) | obrigatório; preenchido pelo backend |
| `situacaoExecucao` | Enumeration | obrigatório; default `em_andamento` |
| `navegador` | Enumeration | obrigatório |
| `iniciadaEm` | Date (datetime) | obrigatório |
| `finalizadaEm` | Date (datetime) | opcional |
| `cidadeOrigem` | Text (Short text) | opcional |
| `origem` | JSON | obrigatório |
| `destinos` | JSON | obrigatório |
| `trajetoPlanejado` | Text (Long text) | opcional; polyline codificada |
| `trajetoReal` | Text (Long text) | opcional; polyline codificada |
| `distanciaPlanejadaMetros` | Number (decimal) | opcional |
| `duracaoPlanejadaSegundos` | Number (big integer) | opcional |
| `distanciaPercorridaMetros` | Number (decimal) | opcional |

| `duracaoTotalSegundos` | Number (big integer) | opcional |
| `tempoMovimentoSegundos` | Number (big integer) | opcional |
| `tempoParadoSegundos` | Number (big integer) | opcional |
| `duracaoSemSinalSegundos` | Number (big integer) | opcional |
| `quantidadeDesvios` | Number (integer) | opcional |
| `quantidadePontos` | Number (integer) | opcional |
| `quantidadeDestinosPlanejados` | Number (integer) | opcional |
| `quantidadeDestinosVisitados` | Number (integer) | opcional |
| `destinosVisitados` | JSON | opcional |
| `ordemDestinosVisitados` | JSON | opcional |
| `detalhesDestinosVisitados` | JSON | opcional; confirmações individuais |
| `chegadaDestinoFinalEm` | Date (datetime) | opcional |
| `conclusaoConfirmadaEm` | Date (datetime) | opcional |
| `duracaoAteDestinoFinalSegundos` | Number (big integer) | opcional |
| `destinosConfirmadosPorGps` | Boolean | obrigatório; default `false` |
| `rotaConfirmadaPorGps` | Boolean | obrigatório; default `false` |
| `teveInterrupcaoLocalizacao` | Boolean | obrigatório; default `false` |
| `quantidadeInterrupcoesLocalizacao` | Number (integer) | obrigatório; default `0` |
| `duracaoLocalizacaoIndisponivelSegundos` | Number (big integer) | opcional |
| `ocorrenciasLocalizacao` | JSON | opcional |
| `motivoFinalizacao` | Enumeration | opcional |
| `ultimaLocalizacaoEm` | Date (datetime) | opcional |
| `ultimaSincronizacaoEm` | Date (datetime) | opcional; recebimento mais recente no servidor |
| `atrasoUltimaSincronizacaoSegundos` | Number (big integer) | opcional |
| `maiorAtrasoSincronizacaoSegundos` | Number (big integer) | opcional |
| `origemFinalizacao` | Enumeration | opcional |
| `versaoAplicativo` | Text (Short text) | opcional |
| `segmentos` | Relation | one-to-many com `segmento-execucao-rota` |

`cidadeOrigem` e `origem` são produzidos pelo mesmo snapshot de localização no
aplicativo. A tela não envia uma cidade previamente armazenada. Se somente a
geocodificação reversa falhar, `cidadeOrigem` pode ser nula e as coordenadas da
execução continuam válidas; nenhuma alteração de schema é necessária.

Valores de `situacaoExecucao`:

```text
em_andamento
concluida
concluida_parcial
cancelada
interrompida
```

Valores de `navegador`:

```text
google
waze
```

Valores de `motivoFinalizacao`:

```text
concluida_automaticamente
cancelada_abertura_navegador
interrompida_usuario
interrompida_logout
interrompida_troca_dispositivo
interrompida_erro
interrompida_inatividade
```

Valores de `origemFinalizacao`:

```text
aplicativo
servidor_destino_confirmado
servidor_inatividade
servidor_troca_dispositivo
```

Exemplo de `origem`:

```json
{
  "latitude": -22.72528,
  "longitude": -47.64917
}
```

Exemplo de `destinos`:

```json
[
  {
    "codigo": 25,
    "nome": "Filial 25",
    "cidade": "Piracicaba",
    "ordem": 1,
    "tipo": "loja",
    "latitude": -22.73142,
    "longitude": -47.65581
  }
]
```

Os valores aceitos para `tipo` dentro do JSON são `loja`, `restaurante` e
`posto_combustivel`.

## 2. Collection `segmento-execucao-rota`

Crie outra Collection Type:

- Display name: `Segmento de execução de rota`
- API ID singular: `segmento-execucao-rota`
- API ID plural: `segmentos-execucao-rota`
- Draft & Publish: desativado

| Campo | Tipo no Strapi | Configuração |
| --- | --- | --- |
| `codigoLote` | Text (Short text) | obrigatório e único |
| `execucao` | Relation | many-to-one com `execucao-rota`, obrigatório |
| `sequenciaInicial` | Number (integer) | obrigatório |
| `sequenciaFinal` | Number (integer) | obrigatório |
| `inicioEm` | Date (datetime) | obrigatório |
| `fimEm` | Date (datetime) | obrigatório |
| `quantidadePontos` | Number (integer) | obrigatório |
| `pontos` | JSON | obrigatório |

Exemplo de `pontos`:

```json
[
  {
    "sequencia": 1,
    "latitude": -22.72528,
    "longitude": -47.64917,
    "precisao": 8.4,
    "velocidade": 12.8,
    "direcao": 183,
    "registradoEm": "2026-07-30T12:00:00.000Z"
  }
]
```

O aplicativo envia no máximo 100 pontos por lote. `codigoLote` é formado pelo
código da sessão e pelo intervalo de sequências, portanto uma repetição da
mesma requisição não pode criar outro segmento.

## 3. Ajustes em `historico-visitas`

Adicione os campos opcionais abaixo para manter compatibilidade com os
registros antigos:

| Campo | Tipo | Configuração |
| --- | --- | --- |
| `codigoSessao` | Text (Short text) | único e opcional |
| `situacaoExecucao` | Enumeration | `concluida` ou `concluida_parcial`; opcional |
| `destinosPlanejados` | Number (integer) | opcional |
| `destinosVisitados` | Number (integer) | opcional |
| `rotaConfirmadaPorGps` | Boolean | opcional; default `false` |
| `detalhesDestinosVisitados` | JSON | opcional |

Registros antigos permanecem com o campo vazio. Esse identificador impede que
uma repetição da finalização crie duas entradas no histórico.

O backend deve criar `historico-visitas` somente quando:

1. a execução terminar como `concluida` ou `concluida_parcial`;
2. ao menos um destino tiver chegada confirmada por GPS;
3. ainda não existir histórico com o mesmo `codigoSessao`.

Uma execução com todos os destinos confirmados gera histórico `concluida`.
Quando apenas parte deles for confirmada e a execução for encerrada, o
histórico recebe `concluida_parcial`. Execuções canceladas ou sem nenhuma
visita confirmada ficam apenas em `execucoes-rotas`.

Ao receber o lote que confirma todos os destinos, o backend também pode
consolidar imediatamente a execução e o histórico. O POST final do aplicativo
permanece idempotente e pode complementar as ocorrências de localização sem
criar outro histórico. Essa regra evita que uma rota comprovadamente concluída
fique aberta porque o aplicativo foi fechado antes do último request.

## 4. Prévia da rota sem iniciar execução

O endpoint existente `POST /estimativa-rota/calcular` é somente de consulta.
Ele deve aceitar vários destinos ordenados e nunca criar registros em
`execucoes-rotas` ou `historico-visitas`.

Requisição:

```json
{
  "origin": {
    "latitude": -22.7253,
    "longitude": -47.6492
  },
  "destinations": [
    {
      "latitude": -22.9000,
      "longitude": -47.0600
    }
  ]
}
```

Resposta:

```json
{
  "durationSeconds": 3180,
  "durationMinutes": 53,
  "durationText": "53 min",
  "distanceMeters": 42800,
  "distanceKm": 42.8,
  "distanceText": "42,8 km",
  "encodedPolyline": "polyline-codificada"
}
```

O campo singular `destination` permanece aceito para aplicativos antigos. A
chave da Routes API continua somente no servidor.

## 5. Rotas customizadas

Crie:

```text
src/api/execucao-rota/routes/01-execucao-rota-custom.ts
```

O prefixo `01-` faz as rotas específicas serem carregadas antes da rota
genérica `/:documentId`.

```ts
import type {Core} from '@strapi/strapi';

const routes: Core.RouterConfig = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/execucoes-rotas/iniciar',
      handler:
        'api::execucao-rota.execucao-rota.iniciar',
    },
    {
      method: 'POST',
      path: '/execucoes-rotas/:codigoSessao/segmentos',
      handler:
        'api::execucao-rota.execucao-rota.adicionarSegmento',
    },
    {
      method: 'POST',
      path: '/execucoes-rotas/:codigoSessao/finalizar',
      handler:
        'api::execucao-rota.execucao-rota.finalizar',
    },
  ],
};

export default routes;
```

Não configure `auth: false`. As três rotas precisam do JWT do aplicativo.

## 6. `POST /execucoes-rotas/iniciar`

O aplicativo envia:

```json
{
  "codigoSessao": "rota-mabc123-xpto1234",
  "navegador": "google",
  "iniciadaEm": "2026-07-30T12:00:00.000Z",
  "cidadeOrigem": "Piracicaba",
  "origem": {
    "latitude": -22.72528,
    "longitude": -47.64917
  },
  "destinos": [
    {
      "codigo": 25,
      "nome": "Filial 25",
      "cidade": "Piracicaba",
      "ordem": 1,
      "tipo": "loja",
      "latitude": -22.73142,
      "longitude": -47.65581
    }
  ],
  "versaoAplicativo": "2.0.7"
}
```

Responsabilidades do controller/service:

1. exigir `ctx.state.user`;
2. exigir ao menos um destino e validar tamanho, tipos, datas e coordenadas;
3. procurar uma execução pelo `codigoSessao`;
4. se já existir e pertencer ao mesmo usuário, retornar o registro existente;
5. se pertencer a outro usuário, responder `403`;
6. obter `username`, `setor` e relação `usuario` de `ctx.state.user`, nunca do
   corpo enviado pelo celular;
7. calcular o trajeto planejado no backend;
8. criar a execução com `situacaoExecucao: em_andamento`;
9. retornar o planejamento.

Resposta esperada:

```json
{
  "data": {
    "documentId": "document-id-do-strapi",
    "trajetoPlanejado": "polyline-codificada",
    "distanciaPlanejadaMetros": 42800,
    "duracaoPlanejadaSegundos": 3180
  }
}
```

Se o cálculo externo falhar, a execução ainda deve ser criada e pode retornar
planejamento `null`. Isso preserva o rastreamento para sincronização posterior.

## 7. Cálculo da rota planejada

A chave de servidor deve ficar somente no `.env` do Strapi:

```dotenv
GOOGLE_ROUTES_API_KEY=
```

Nunca use no backend a chave móvel configurada no Expo. Crie uma chave
separada, restrita à Routes API e, se possível, ao IP do servidor.

O service deve chamar:

```text
POST https://routes.googleapis.com/directions/v2:computeRoutes
```

Headers:

```text
Content-Type: application/json
X-Goog-Api-Key: <GOOGLE_ROUTES_API_KEY>
X-Goog-FieldMask: routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline
```

Mapeamento:

- `origin`: localização inicial;
- `destination`: último item de `destinos`;
- `intermediates`: todos os destinos anteriores ao último;
- `travelMode`: `DRIVE`;
- `routingPreference`: `TRAFFIC_AWARE`.

Armazene `routes[0].polyline.encodedPolyline`,
`routes[0].distanceMeters` e a duração convertida para segundos.

## 8. Endpoint de segmentos

`POST /execucoes-rotas/:codigoSessao/segmentos`

Regras:

1. localizar a execução pelo código;
2. confirmar que ela pertence a `ctx.state.user`;
3. rejeitar sessões canceladas ou de outro usuário;
4. aceitar no máximo 100 pontos;
5. validar latitude, longitude, precisão, sequência e data;
6. procurar `codigoLote`;
7. se já existir para a mesma execução, retornar sucesso sem duplicar;
8. criar o segmento e atualizar `ultimaLocalizacaoEm`;
9. reavaliar as confirmações dos destinos, preservando chegadas já
   confirmadas e a ordem real das visitas.

Resposta:

```json
{
  "data": {
    "codigoLote": "rota-mabc123-xpto1234:1:100",
    "recebido": true
  }
}
```

O endpoint deve ser idempotente porque o celular pode ter enviado os dados,
perdido a resposta e tentar novamente.

Ao receber novos segmentos, o backend pode atualizar
`destinosVisitados`, `ordemDestinosVisitados`,
`detalhesDestinosVisitados` e as respectivas quantidades. Assim uma visita
parcial já fica visível na execução, mesmo antes de seu encerramento.

## 9. Endpoint de finalização

`POST /execucoes-rotas/:codigoSessao/finalizar`

O aplicativo envia `situacaoExecucao`, data, motivo e um `resumo` provisório.
Para que o
relatório do gestor seja confiável, o backend deve:

1. carregar e ordenar todos os segmentos pela sequência;
2. remover pontos duplicados;
3. ignorar coordenadas inválidas e precisão superior a 100 metros;
4. rejeitar saltos incompatíveis com velocidade de até 60 m/s mais a
   tolerância de precisão;
5. recalcular distância, tempos, lacunas, chegadas e desvios;
6. considerar chegada somente após três pontos válidos consecutivos próximos
   ao destino, com pelo menos 15 segundos entre o primeiro e o terceiro;
7. usar raio base de 120 metros, respeitando a precisão válida do GPS;
8. concluir automaticamente quando todos os destinos forem confirmados;
9. usar `concluida_parcial` quando uma execução encerrada possuir apenas parte
   dos destinos confirmados;
10. atualizar os campos consolidados e as ocorrências de localização;
11. criar o histórico completo ou parcial conforme as regras da seção 3.

Uma nova chamada para execução já finalizada deve retornar o resultado
existente, sem duplicar histórico nem recalcular desnecessariamente.

Para manter o mesmo critério do aplicativo, um desvio começa após três pontos
válidos consecutivos a mais de 100 metros da polyline planejada. O retorno à
rota ocorre após dois pontos consecutivos a menos de 60 metros. Quando não
houver `trajetoPlanejado`, `quantidadeDesvios` deve permanecer `null`, não zero.

`duracaoTotalSegundos` termina automaticamente na confirmação do último
destino necessário ou, em uma execução parcial, no horário da interrupção.
`conclusaoConfirmadaEm` representa o momento em que a última parada pendente
foi confirmada. `chegadaDestinoFinalEm` continua representando a chegada ao
último destino da ordem planejada.

Exemplo de `ocorrenciasLocalizacao`:

```json
[
  {
    "tipo": "localizacao_desativada",
    "detectadaEm": "2026-07-30T12:30:00.000Z",
    "normalizadaEm": "2026-07-30T12:35:00.000Z",
    "duracaoSegundos": 300
  }
]
```

As ocorrências enviadas pelo celular são indícios operacionais. O backend
também deve calcular lacunas pelos próprios pontos recebidos. Uma rota pode
ter todos os destinos confirmados e, ainda assim, manter
`rotaConfirmadaPorGps: false` quando houve interrupção de localização.

### Execuções abandonadas

A conclusão normal não depende de botão: ocorre quando todos os destinos são
confirmados. O aplicativo oferece apenas uma ação excepcional de interrupção
na tela de rotas. Logout e troca de usuário também encerram a execução.

Como proteção adicional, configure no backend uma rotina agendada para
identificar execuções `em_andamento` sem atualização por um período definido
pela operação. Se houver destino confirmado, encerre como
`concluida_parcial`; se não houver nenhum, use `interrompida`. O tempo não deve
ficar fixo somente no código: use `ROUTE_EXECUTION_STALE_MINUTES`. O padrão
operacional atual é `360` minutos sem evidência nova no servidor. Esse limite
não encerra uma viagem de mais de seis horas que continue sincronizando; ele
protege apenas sessões sem atualização.

## 10. Histórico compatível

Para uma execução confirmada, crie em `historico-visitas`:

```json
{
  "codigoSessao": "rota-mabc123-xpto1234",
  "situacaoExecucao": "concluida",
  "destinosPlanejados": 1,
  "destinosVisitados": 1,
  "rotaConfirmadaPorGps": true,
  "datahora": "2026-07-30T13:07:30.000Z",
  "username": "usuario-do-jwt",
  "setor": "setor-do-jwt",
  "cidadeOrigem": "Piracicaba",
  "tipoHistorico": "loja",
  "rotas": [
    {
      "codigofilial": 25,
      "nomefilial": "Filial 25",
      "nomecidade": "Piracicaba",
      "ordem": 1
    }
  ],
  "detalhesDestinosVisitados": [
    {
      "codigo": 25,
      "ordemPlanejada": 1,
      "ordemVisita": 1,
      "confirmadoEm": "2026-07-30T13:07:30.000Z"
    }
  ]
}
```

Use `conclusaoConfirmadaEm` como `datahora` em uma rota completa. Em uma
execução parcial, use o horário da última visita confirmada. O campo `rotas`
do histórico parcial deve conter apenas os destinos comprovadamente visitados;
o planejamento completo permanece preservado em `execucao-rota`.
`tipoHistorico` vem de `tipo` nos destinos.

## 11. Permissões e segurança

### Chave operacional do monitoramento

O single type `configuracao-app` possui o campo Boolean obrigatório
`monitoramentoRotasAtivo`, com padrão `true`.

Quando estiver desativado, o aplicativo não chama
`POST /estimativa-rota/calcular`, não cria execução local, não ativa o GPS em
segundo plano e apenas abre Maps ou Waze. A consulta da configuração ocorre no
momento de traçar a rota, permitindo desligar o recurso sem publicar outra
versão.

A última decisão obtida com sucesso é persistida no aparelho. Se o Strapi ficar
indisponível e a decisão conhecida for `true`, o aplicativo inicia o registro
local sem exigir a prévia da Routes API. Uma instalação sem decisão anterior
permanece no modo externo até conseguir consultar o servidor.

A prévia válida também é enviada em `planejamento` para
`POST /execucoes-rotas/iniciar`. O backend usa esses dados somente como
planejamento; chegadas, duração real, distância percorrida e desvios continuam
sendo recalculados a partir dos segmentos GPS.

No Users & Permissions, libere somente `find` de `configuracao-app` para o
papel `Authenticated`.

### Permissões das execuções

No Users & Permissions:

- `Public`: nenhuma permissão das duas collections;
- `Authenticated`: somente `iniciar`, `adicionarSegmento` e `finalizar`;
- não liberar `create`, `update` ou `delete` genéricos para o aplicativo;
- consultas do gestor devem usar endpoint e policy próprios;
- o endpoint do gestor deve validar papel/setor.

Não aceite do celular ID/username do proprietário nem as métricas como verdade
definitiva. Valide sempre propriedade da sessão e limite o tamanho do corpo.
Também defina retenção para segmentos brutos; resumos e polylines podem ser
mantidos por mais tempo.

## 12. Ordem para disponibilização

1. Criar as duas collections.
2. Adicionar `codigoSessao` em `historico-visitas`.
3. Implementar controller, service e rotas customizadas.
4. Configurar `GOOGLE_ROUTES_API_KEY`.
5. Reiniciar o Strapi.
6. Conferir com `yarn strapi routes:list`.
7. Habilitar as três ações no papel `Authenticated`.
8. Publicar o backend.
9. Gerar uma nova build do aplicativo.

A build é obrigatória porque foram adicionados módulos nativos e permissões de
localização. O rastreamento em segundo plano não funciona corretamente no
Expo Go nem em um APK antigo.
