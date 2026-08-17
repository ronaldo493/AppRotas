# Sincronização de contatos pela origem corporativa

Este fluxo compara o arquivo corporativo de contatos com os registros publicados
no Strapi e permite usar a origem como fonte de verdade.

## Origem

```text
G:\Arquivos Ti\Atualização Teste Conexões\Informacoes_Contatos.json
```

## Identificação e campos

A identidade é formada por `departamento + colaboradores`. Todos os campos do
modelo participam da comparação e da criação:

```text
departamento
colaboradores
ramal
ddr
email
```

## Comparar

```bash
yarn dados:contatos:comparar-origem
```

O comando informa contatos novos, alterados, iguais, inválidos e ausentes na
origem. Nenhum dado é alterado.

Depois de uma sincronização, execute esse comando novamente. O resultado
esperado é `Criar: 0`, `Atualizar: 0`, `Inválidos: 0` e
`Ausentes na origem: 0`.

## Sincronizar completamente

Depois de revisar o relatório:

Depois de publicar o Strapi com `email` como `Text`, configure:

```env
DATA_SYNC_CONTACT_EMAIL_TEXT_CONFIRMED=true
```

Execute:

```bash
yarn dados:contatos:sincronizar-origem --apply
```

O comando:

- cria contatos novos;
- atualiza todos os campos dos contatos existentes;
- exclui do Strapi contatos que não aparecem mais na origem;
- mantém contatos sem alteração;
- gera automaticamente um backup dos contatos atuais antes da primeira escrita;
- só inicia exclusões se todas as criações e atualizações terminarem sem erro.

Se houver identidade duplicada ou outro registro inválido sem uma resolução
objetiva, o lote é bloqueado antes da primeira escrita.

## Regra para duplicidades

Para contatos repetidos com o mesmo `departamento + colaboradores`:

1. prioriza o registro cujo `ramal` possui número;
2. se mais de um possuir número, prioriza o registro com mais campos preenchidos;
3. se continuar empatado com dados diferentes, bloqueia a sincronização.

No arquivo atual, os dois registros da Regina possuem ramal `1600`. O desempate
mantém o registro que também possui DDR `(19) 3429-1226`, pois é o mais completo.

## Pré-requisitos

O campo `email` da collection `Contatos` precisa ser do tipo `Text`, pois a
origem possui contatos com mais de um endereço. Depois de modificar o schema, o
Strapi precisa ser publicado/recriado antes da importação.

O comando anterior para inserir somente ausentes permanece disponível:

```bash
yarn dados:contatos:inserir-ausentes-origem --apply
```
