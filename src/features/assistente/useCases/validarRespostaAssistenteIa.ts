export interface RespostaAssistenteIa {
  interpretado: boolean;
  comandoCanonico: string | null;
  confianca: number;
}

const CONFIANCA_MINIMA = 0.65;
const MAX_COMANDO_LENGTH = 180;

/**
 * Trata a resposta do backend como dado não confiável. Somente um comando
 * curto e confiante pode voltar para os interpretadores locais.
 */
export const validarRespostaAssistenteIa = (
  input: unknown,
): RespostaAssistenteIa => {
  if (!input || typeof input !== 'object') {
    return {interpretado: false, comandoCanonico: null, confianca: 0};
  }

  const data = input as Record<string, unknown>;
  const confianca = typeof data.confianca === 'number' &&
    Number.isFinite(data.confianca)
    ? Math.min(1, Math.max(0, data.confianca))
    : 0;
  const comando = typeof data.comandoCanonico === 'string'
    ? data.comandoCanonico.replace(/\s+/g, ' ').trim()
    : '';
  const interpretado = data.interpretado === true &&
    confianca >= CONFIANCA_MINIMA &&
    comando.length > 0 &&
    comando.length <= MAX_COMANDO_LENGTH;

  return interpretado
    ? {interpretado: true, comandoCanonico: comando, confianca}
    : {interpretado: false, comandoCanonico: null, confianca};
};

