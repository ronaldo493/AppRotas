# Sincronização administrativa de dados

Esta ferramenta exporta, compara e sincroniza filiais, pontos de apoio e
usuários com o Strapi. Ela é independente do aplicativo: não entra no bundle do
Expo e não exige uma nova versão do APK.

## Organização da pasta

```text
tools/data-sync/
├── input/       Arquivos JSON usados apenas nas importações manuais
├── output/      Relatórios, exportações e backups gerados pela ferramenta
├── src/         Código-fonte TypeScript da ferramenta
├── .env.local   Configuração privada local, ignorada pelo Git
└── README.md    Instruções de operação
```

A rotina corporativa de filiais e contatos não utiliza `input/`: ela lê
diretamente `Informacoes_Filiais.json` e `Informacoes_Contatos.json` no
diretório configurado por `DATA_SYNC_SOURCE_DIR`. A pasta `input/` existe para
operações manuais que recebem o parâmetro `--input`. Normalmente, quem executa
a rotina só precisa atualizar os arquivos corporativos, rodar os comandos
documentados e conferir os resultados em `output/`.

Os arquivos de `src/` implementam leitura, validação, comparação e comunicação
com o Strapi. Eles não contêm dados de produção e não precisam ser modificados
durante uma atualização comum.

O fluxo específico de atualização pelo arquivo corporativo está detalhado em
[`FILIAIS_ORIGEM.md`](./FILIAIS_ORIGEM.md).

O fluxo completo de sincronização de contatos está detalhado em
[`CONTATOS_ORIGEM.md`](./CONTATOS_ORIGEM.md).

## Segurança operacional

- Todo comando é uma simulação por padrão.
- Alterações somente são enviadas quando `--apply` é informado.
- O fluxo corporativo de filiais nunca cria ou exclui registros.
- A sincronização completa de contatos pode excluir registros ausentes na
  origem, mas cria um backup preventivo e exige `--apply`.
- Registros inválidos impedem a aplicação do lote.
- Toda comparação gera um relatório em `output/`.
- Tokens e senhas ficam apenas em `.env.local`, ignorado pelo Git.

## Backup completo

Para guardar uma cópia local dos dados utilizados pelo aplicativo:

```bash
yarn dados:backup
```

Cada execução cria uma pasta nova em:

```text
tools/data-sync/output/backups/AAAA-MM-DDTHH-MM-SS/
```

Ela contém:

```text
filiais.json
pontos.json
usuarios.json
setores.json
menus.json
manifesto.json
```

O `manifesto.json` registra a origem, o horário e a quantidade de itens de cada
arquivo. Menus são exportados com seus setores; setores são exportados com seus
menus; usuários incluem sua role. Senhas, tokens de redefinição e tokens de
confirmação nunca são armazenados.

O backup contém dados pessoais de colaboradores. A pasta `output/` é ignorada
pelo Git e deve permanecer em um local de acesso restrito.

## Configuração

Copie `.env.example` para `.env.local` e preencha:

```env
DATA_SYNC_STRAPI_URL=https://rotas.drogal.com.br
DATA_SYNC_STRAPI_TOKEN=seu_token
DATA_SYNC_TIMEOUT_MS=15000
DATA_SYNC_MAX_CHANGES=1000
```

Para usuários, informe também:

```env
DATA_SYNC_DEFAULT_PASSWORD=senha_inicial
DATA_SYNC_USER_ROLE_ID=4
```

`DATA_SYNC_MAX_CHANGES` impede que uma quantidade inesperada de alterações seja
aplicada. Aumente conscientemente quando uma carga inicial superar o limite.

## Comparar arquivos corporativos

Por padrão, o comando procura estes arquivos:

```text
G:\Arquivos Ti\Atualização Teste Conexões\Informacoes_Filiais.json
G:\Arquivos Ti\Atualização Teste Conexões\Informacoes_Contatos.json
```

Execute:

```bash
yarn dados:comparar-origem
```

O caminho pode ser alterado em `.env.local`:

```env
DATA_SYNC_SOURCE_DIR=G:\Arquivos Ti\Atualização Teste Conexões
```

Nas filiais, a identidade é `codigofilial` e somente estes campos entram na
comparação:

- `gerente`;
- `supervisor`;
- `telefone`;
- `horariofuncionamento`.

Nos contatos, a identidade é `departamento + colaboradores` e todos os campos
do modelo são comparados:

- `departamento`;
- `colaboradores`;
- `ramal`;
- `ddr`;
- `email`.

São informados registros novos, alterados, iguais, inválidos e registros que
existem no Strapi mas estão ausentes no arquivo corporativo. Esse comando é
somente leitura e não aceita `--apply`.

## Filiais

Para atualizar filiais a partir do arquivo corporativo, execute nesta ordem:

```bash
yarn dados:filiais:exportar
yarn dados:filiais:comparar-origem
yarn dados:filiais:atualizar-origem --apply
yarn dados:filiais:comparar-origem
```

O primeiro comando preserva o estado publicado atual em
`tools/data-sync/output/filiais-export.json`. O segundo somente compara. O
terceiro atualiza a produção. O último confirma que não restaram alterações
pendentes.

Esse fluxo:

- identifica a filial por `codigofilial`;
- atualiza somente filiais que já existem no Strapi;
- nunca cria ou exclui filiais;
- envia somente `gerente`, `supervisor`, `telefone` e
  `horariofuncionamento` quando realmente mudaram;
- ignora valores vazios vindos da origem;
- não altera endereço, cidade, CNPJ, coordenadas ou outros campos.

Depois da validação final, o resultado esperado é `Atualizar: 0`. A linha
`Ignoradas por não existirem no Strapi` informa registros presentes apenas no
arquivo corporativo. Eles nunca são criados pelo comando de atualização.

### Importação manual legada

Os comandos abaixo aceitam um JSON informado manualmente e possuem regras
diferentes do fluxo corporativo. Use-os somente quando houver uma necessidade
específica e depois de revisar o relatório:

```bash
yarn dados:filiais:validar
yarn dados:filiais:comparar
```

Comparar outro arquivo:

```bash
yarn dados:filiais:comparar --input tools/data-sync/input/filiais.json
```

Aplicar depois de revisar o relatório:

```bash
yarn dados:filiais:comparar --input tools/data-sync/input/filiais.json --apply
```

Nesse fluxo manual, a chave é `codigofilial`, registros ausentes podem ser
criados e valores `null` podem limpar dados existentes. Ele não deve ser usado
na rotina de atualização do arquivo corporativo.

## Pontos de apoio

```bash
yarn dados:pontos:exportar
yarn dados:pontos:validar --input tools/data-sync/input/pontos.json
yarn dados:pontos:comparar --input tools/data-sync/input/pontos.json
yarn dados:pontos:comparar --input tools/data-sync/input/pontos.json --apply
```

Se o JSON possuir `documentId`, ele será usado como identidade. Para um ponto
novo, a identidade é formada por categoria, coordenadas e descrição. Rodar o
mesmo arquivo novamente não deve criar duplicidades.

## Usuários

Crie o arquivo a partir de `input/usuarios.example.json` e execute:

```bash
yarn dados:usuarios:validar --input tools/data-sync/input/usuarios.json
yarn dados:usuarios:comparar --input tools/data-sync/input/usuarios.json
yarn dados:usuarios:comparar --input tools/data-sync/input/usuarios.json --apply
```

O e-mail é a chave do usuário. Usuários existentes são ignorados; os novos são
criados confirmados, desbloqueados e com `deveAlterarSenha: true`. A ferramenta
não troca senha nem altera usuários existentes automaticamente.

## Relatórios

Cada execução de comparação cria um JSON contendo:

- registros que seriam criados;
- registros que seriam atualizados e seus campos alterados;
- registros sem mudança;
- registros inválidos;
- falhas retornadas pelo Strapi durante a aplicação.

Os relatórios são locais e ficam em `tools/data-sync/output/`.

## Arquivos antigos

A pasta `fixtures/` foi preservada para não descartar dados históricos. Seus
scripts antigos não devem ser usados para novas cargas, pois possuem URLs fixas,
não têm modo de simulação e alguns fazem `POST` repetido. Os JSONs existentes
continuam podendo ser fornecidos à ferramenta nova por meio de `--input`.
