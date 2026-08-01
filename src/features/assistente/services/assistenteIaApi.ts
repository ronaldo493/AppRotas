import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import {
  validarRespostaAssistenteIa,
  type RespostaAssistenteIa,
} from '../useCases/validarRespostaAssistenteIa';

interface SolicitarInterpretacaoParams {
  texto: string;
  telaAtual?: string;
}

const RESPOSTA_VAZIA: RespostaAssistenteIa = {
  interpretado: false,
  comandoCanonico: null,
  confianca: 0,
};
const COOLDOWN_INDISPONIBILIDADE_MS = 60_000;
const CACHE_INTERPRETACAO_MS = 15 * 60_000;
const MAX_INTERPRETACOES_CACHEADAS = 100;
const indisponivelAteByServer = new Map<string, number>();
const requestsByCommand = new Map<string, Promise<RespostaAssistenteIa>>();
const interpretationsByCommand = new Map<
  string,
  {resposta: RespostaAssistenteIa; expiraEm: number}
>();

const cacheInterpretacao = (
  requestKey: string,
  resposta: RespostaAssistenteIa,
): void => {
  if (!resposta.interpretado) return;

  interpretationsByCommand.delete(requestKey);
  interpretationsByCommand.set(requestKey, {
    resposta,
    expiraEm: Date.now() + CACHE_INTERPRETACAO_MS,
  });

  while (interpretationsByCommand.size > MAX_INTERPRETACOES_CACHEADAS) {
    const primeiraChave = interpretationsByCommand.keys().next().value;
    if (typeof primeiraChave !== 'string') break;
    interpretationsByCommand.delete(primeiraChave);
  }
};

/**
 * Única porta de saída da funcionalidade de IA no aplicativo. A chave e o
 * contexto de domínio permanecem no backend; o app envia só frase e tela.
 */
export const solicitarInterpretacaoAssistenteIa = async (
  client: AxiosInstance,
  params: SolicitarInterpretacaoParams,
): Promise<RespostaAssistenteIa> => {
  const texto = params.texto.replace(/\s+/g, ' ').trim();
  if (!texto || texto.length > 320) return RESPOSTA_VAZIA;

  const serverKey = String(client.defaults.baseURL ?? 'strapi');
  if ((indisponivelAteByServer.get(serverKey) ?? 0) > Date.now()) {
    return RESPOSTA_VAZIA;
  }

  const requestKey = `${serverKey}|${params.telaAtual ?? ''}|${texto.toLocaleLowerCase('pt-BR')}`;
  const cached = interpretationsByCommand.get(requestKey);
  if (cached && cached.expiraEm > Date.now()) return cached.resposta;
  if (cached) interpretationsByCommand.delete(requestKey);

  const activeRequest = requestsByCommand.get(requestKey);
  if (activeRequest) return activeRequest;

  const request = (async (): Promise<RespostaAssistenteIa> => {
    try {
      const response = await client.post<StrapiSingleResponse<unknown>>(
        '/assistente-ia/interpretar',
        {
          texto,
          ...(params.telaAtual ? {telaAtual: params.telaAtual} : {}),
        },
        {
          timeout: 4_500,
          'axios-retry': {retries: 0},
        },
      );

      const resposta = validarRespostaAssistenteIa(response.data.data);
      cacheInterpretacao(requestKey, resposta);
      return resposta;
    } catch {
      // Evita repetir uma espera longa enquanto o backend/provedor está fora.
      indisponivelAteByServer.set(
        serverKey,
        Date.now() + COOLDOWN_INDISPONIBILIDADE_MS,
      );
      return RESPOSTA_VAZIA;
    }
  })();

  requestsByCommand.set(requestKey, request);
  return request.finally(() => {
    if (requestsByCommand.get(requestKey) === request) {
      requestsByCommand.delete(requestKey);
    }
  });
};
