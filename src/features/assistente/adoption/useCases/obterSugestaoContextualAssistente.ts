import type {
  EstadoAdocaoAssistente,
  SugestaoContextualAssistente,
} from '../models/AssistenteAdocao';

export const DICA_DESCOBERTA_ASSISTENTE: SugestaoContextualAssistente = {
  id: 'descoberta-assistente',
  tipo: 'descoberta',
  mensagem: 'Precisa de ajuda? Pergunte sobre filiais, contatos, pontos e rotas.',
  pergunta: '',
};

const SUGESTOES_POR_TELA: Record<string, SugestaoContextualAssistente> = {
  Home: {
    id: 'rotas',
    tipo: 'contextual',
    mensagem: 'Você pode pedir ajuda para montar ou consultar uma rota.',
    pergunta: 'Como posso montar uma rota?',
  },
  MapaLojas: {
    id: 'filiais',
    tipo: 'contextual',
    mensagem: 'Pergunte sobre telefone, gerente ou horário de uma filial.',
    pergunta: 'Qual o telefone da filial 25?',
  },
  Pontos: {
    id: 'pontos',
    tipo: 'contextual',
    mensagem: 'Procure restaurantes ou postos cadastrados.',
    pergunta: 'Encontre um restaurante.',
  },
  Contatos: {
    id: 'contatos',
    tipo: 'contextual',
    mensagem: 'Pergunte o ramal de uma pessoa ou departamento.',
    pergunta: 'Quais são os departamentos cadastrados?',
  },
  Historico: {
    id: 'historico',
    tipo: 'contextual',
    mensagem: 'Peça um resumo das suas rotas.',
    pergunta: 'Resuma minhas rotas de hoje.',
  },
  Admin: {
    id: 'admin',
    tipo: 'contextual',
    mensagem: 'Consulte as rotas que precisam de atenção.',
    pergunta: 'Quais rotas foram interrompidas hoje?',
  },
  Patrimonio: {
    id: 'patrimonio',
    tipo: 'contextual',
    mensagem: 'Pergunte como funciona o registro de patrimônio.',
    pergunta: 'Como funciona o registro de patrimônio?',
  },
};

/** Usa o calendário local do aparelho para não repetir a descoberta no mesmo dia. */
export function obterChaveDataLocal(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Decide a descoberta sem depender da interface ou do armazenamento. */
export function podeExibirDicaDescoberta(
  estado: EstadoAdocaoAssistente,
  dataAtual: string,
): boolean {
  return !estado.assistenteDescoberta &&
    estado.datasDicaDescobertaExibida.length < 2 &&
    !estado.datasDicaDescobertaExibida.includes(dataAtual);
}

/** Retorna uma sugestão editorial; nenhum dado da tela é capturado. */
export function obterSugestaoContextualAssistente(
  tela: string | undefined,
): SugestaoContextualAssistente | null {
  return tela ? SUGESTOES_POR_TELA[tela] ?? null : null;
}

export const EXEMPLOS_INICIAIS_ASSISTENTE = [
  'Qual o telefone da filial 25?',
  'Encontre um restaurante.',
  'Resuma minhas rotas de hoje.',
] as const;