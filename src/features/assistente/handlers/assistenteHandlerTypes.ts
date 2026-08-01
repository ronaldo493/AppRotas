import type {MenuRouteName} from '../../../application/navigation/menuRegistry';
import type {ResultadoEsperaAssistente} from '../useCases/aguardarDadosAssistente';

export type ResponderAssistente = (
  texto: string,
  textoFalado?: string,
) => void;

export type AguardarComFeedbackAssistente = <T>(
  promessa: Promise<T>,
  mensagem: string,
) => Promise<ResultadoEsperaAssistente<T>>;

export type VerificarAcessoAssistente = (rota: MenuRouteName) => boolean;
export type InformarAcessoNegadoAssistente = (recurso: string) => void;

export interface AssistenteHandlerDependencies {
  responder: ResponderAssistente;
  aguardarComFeedback: AguardarComFeedbackAssistente;
  temAcesso: VerificarAcessoAssistente;
  informarAcessoNegado: InformarAcessoNegadoAssistente;
}

