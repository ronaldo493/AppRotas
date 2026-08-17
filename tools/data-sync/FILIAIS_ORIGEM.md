# Atualização de filiais pela origem corporativa

Este fluxo compara o arquivo corporativo de filiais com os registros publicados
no Strapi e permite atualizar somente dados operacionais previamente definidos.

## Origem

Por padrão, o arquivo utilizado é:

```text
G:\Arquivos Ti\Atualização Teste Conexões\Informacoes_Filiais.json
```

O diretório pode ser alterado em `tools/data-sync/.env.local`:

```env
DATA_SYNC_SOURCE_DIR=G:\Arquivos Ti\Atualização Teste Conexões
```

## Identificação

O campo `codigofilial` relaciona o arquivo corporativo ao Strapi. O nome da
filial não é usado como chave porque pode sofrer alterações de escrita.

## Campos comparados e atualizados

Somente estes campos participam deste fluxo:

```text
gerente
supervisor
telefone
horariofuncionamento
```

Endereço, número, CEP, cidade, UF, CNPJ, coordenadas e demais campos nunca são
alterados por este comando.

Valores `null`, `undefined` ou textos vazios vindos da origem são ignorados.
Isso impede que uma ausência temporária no arquivo apague um dado válido do
Strapi.

## 1. Comparar

Antes da comparação, exporte o estado atual para manter uma cópia local de
segurança:

```bash
yarn dados:filiais:exportar
```

```bash
yarn dados:filiais:comparar-origem
```

Esse comando é somente leitura. Ele informa:

- filiais novas na origem;
- filiais existentes com alterações;
- filiais sem alteração;
- códigos duplicados ou inválidos;
- filiais existentes no Strapi, mas ausentes na origem.

Um relatório JSON é criado em `tools/data-sync/output/` com os valores que
mudaram em cada filial.

## 2. Revisar

Antes de atualizar, confira no relatório:

- quantidade de alterações;
- códigos das filiais;
- campos alterados;
- registros inválidos ou duplicados.

Se existir qualquer código duplicado ou inválido, a atualização inteira é
bloqueada. O script não escolhe automaticamente entre informações conflitantes.

## 3. Atualizar

Depois da revisão:

```bash
yarn dados:filiais:atualizar-origem --apply
```

O comando:

- atualiza somente registros que já existem no Strapi;
- envia somente campos realmente alterados;
- não cria novas filiais;
- não exclui filiais;
- não altera os demais campos;
- continua processando outras filiais se uma requisição individual falhar;
- gera relatório com sucessos e falhas.

Executar `dados:filiais:atualizar-origem` sem `--apply` não altera nada e exibe
uma orientação de confirmação.

## 4. Validar o resultado

Execute novamente a comparação:

```bash
yarn dados:filiais:comparar-origem
```

O resultado esperado para as filiais existentes é `Atualizar: 0`, sem registros
inválidos. A linha `Ignoradas por não existirem no Strapi` é apenas um aviso dos
códigos presentes na origem que não existem no Strapi. Esses registros nunca
são enviados pelo comando de atualização.

Se existirem códigos duplicados, eles serão listados como inválidos e o lote
será bloqueado. A origem deve ser corrigida antes de uma nova tentativa.
