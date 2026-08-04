import type {ComandoAssistente} from '../models/ComandoAssistente';
import {validarComandoAssistenteIa} from './validarComandoAssistenteIa';

export interface RespostaAssistenteIa {
  interpretado: boolean;
  comando: ComandoAssistente | null;
  comandoCanonico: string | null;
  confianca: number;
  precisaEsclarecimento: boolean;
  esclarecimento: string | null;
}

const CONFIANCA_MINIMA = 0.65;
const MAX_COMANDO_LENGTH = 180;
const MAX_ESCLARECIMENTO_LENGTH = 180;
const RESPOSTA_VAZIA: RespostaAssistenteIa = {
  interpretado: false,
  comando: null,
  comandoCanonico: null,
  confianca: 0,
  precisaEsclarecimento: false,
  esclarecimento: null,
};

const limpar = (value: unknown, limite: number): string =>
  typeof value === 'string'
    ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limite)
    : '';

/**
 * Trata a resposta do backend como dado não confiável. O contrato anterior com
 * texto canônico continua aceito durante o rollout entre backend e APK.
 */
export const validarRespostaAssistenteIa = (
  input: unknown,
): RespostaAssistenteIa => {
  if (!input || typeof input !== 'object') return {...RESPOSTA_VAZIA};

  const data = input as Record<string, unknown>;
  const confianca = typeof data.confianca === 'number' &&
    Number.isFinite(data.confianca)
    ? Math.min(1, Math.max(0, data.confianca))
    : 0;
  const comandoCanonico = limpar(data.comandoCanonico, MAX_COMANDO_LENGTH + 1);
  const esclarecimento = limpar(
    data.esclarecimento,
    MAX_ESCLARECIMENTO_LENGTH + 1,
  );

  if (
    data.precisaEsclarecimento === true &&
    esclarecimento.length > 0 &&
    esclarecimento.length <= MAX_ESCLARECIMENTO_LENGTH
  ) {
    return {
      ...RESPOSTA_VAZIA,
      confianca,
      precisaEsclarecimento: true,
      esclarecimento,
    };
  }

  const comando = validarComandoAssistenteIa(data.comando);
  const canonicoValido = comandoCanonico.length > 0 &&
    comandoCanonico.length <= MAX_COMANDO_LENGTH;
  const interpretado = data.interpretado === true &&
    confianca >= CONFIANCA_MINIMA &&
    (comando !== null || canonicoValido);

  return interpretado
    ? {
        interpretado: true,
        comando,
        comandoCanonico: canonicoValido ? comandoCanonico : null,
        confianca,
        precisaEsclarecimento: false,
        esclarecimento: null,
      }
    : {...RESPOSTA_VAZIA, confianca};
};
