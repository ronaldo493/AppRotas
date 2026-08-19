const normalizar = (texto: string): string => texto
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

/** Mantém comandos físicos locais e envia perguntas factuais ao backend V2. */
export const deveConsultarOrquestrador = (texto: string): boolean => {
  const valor = normalizar(texto);
  if (!valor.trim()) return false;
  if ([
    'tracar rota', 'iniciar rota', 'adicionar filial', 'remover filial',
    'mover filial', 'reordenar', 'desfazer', 'mais proximo', 'mais perto',
    'abrir ', 'voltar', 'modo escuro', 'modo claro', 'ativar voz',
    'desativar voz',
  ].some(termo => valor.includes(termo))) return false;

  return [
    'qual', 'quais', 'quanto', 'quantas', 'quem', 'liste', 'listar',
    'resuma', 'resumo', 'historico', 'visita', 'filial', 'loja',
    'contato', 'ramal', 'departamento', 'restaurante', 'posto',
    'colaborador', 'funcionario', 'monitoramento', 'rotas de',
    'ultimas rotas', 'rotas dos ultimos', 'rotas nos ultimos',
    'o que voce faz',
  ].some(termo => valor.includes(termo));
};
