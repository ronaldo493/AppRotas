# Registro de patrimônio

Esta feature concentra o levantamento de patrimônio dos equipamentos. A
preventiva, a reforma, a montagem, a inclusão e a troca são tipos de serviço
associados ao mesmo registro.

## Organização

- `screens`: composição das telas e navegação do fluxo.
- `components`: elementos visuais reutilizáveis e seus estilos.
- `hooks`: estado e operações do formulário.
- `domain`: transformação das informações para o formato do relatório.
- `data`: catálogo de equipamentos e conteúdo estático.
- `models`: tipos do domínio.
- `services`: persistência local e integração com o WhatsApp.

## Fluxo de dados

1. O menu técnico `Patrimonio` abre `PatrimonioEntryScreen`, onde o usuário
   informa a filial e o tipo de serviço.
2. A rota interna `PatrimonioRegistro` abre `PatrimonioFormScreen`, que recebe
   os dados selecionados e coordena os ambientes e equipamentos.
3. `usePatrimonioForm` mantém todos os campos controlados e solicita a
   persistência após cada alteração.
4. `createPatrimonioReport` converte o estado da tela no formato persistido do
   relatório.
5. `patrimonioReportService` agrupa alterações consecutivas, serializa as
   gravações e força a escrita mais recente antes do compartilhamento.

As telas e os componentes não acessam diretamente o sistema de arquivos. O
formato compartilhado permanece compatível com o relatório anterior.

## Desempenho

- Existe uma única instância de câmera para todo o formulário.
- Seletores de modelo são centralizados na tela.
- Seções e equipamentos são memoizados.
- Somente a seção e o equipamento alterados recebem novas referências.
- Digitações consecutivas geram uma única gravação local após 300 ms.
