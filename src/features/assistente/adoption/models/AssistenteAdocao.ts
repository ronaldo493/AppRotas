export interface SugestaoContextualAssistente {
  id: string;
  tipo: 'descoberta' | 'contextual';
  mensagem: string;
  pergunta: string;
}

export interface EstadoAdocaoAssistente {
  assistenteDescoberta: boolean;
  apresentacaoVisualizada: boolean;
  datasDicaDescobertaExibida: string[];
  totalDicasExibidas: number;
  telasComDica: string[];
}