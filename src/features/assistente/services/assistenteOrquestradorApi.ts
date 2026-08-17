import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import {
  ASSISTENTE_PROTOCOL_VERSION,
  type MemoriaAssistenteOrquestrador,
  type RespostaAssistenteOrquestrador,
} from '../models/AssistenteOrquestrador';
import {validarRespostaAssistenteOrquestrador} from '../useCases/validarRespostaAssistenteOrquestrador';

interface ConversarComOrquestradorParams {
  transcricoes: readonly string[];
  telaAtual?: string;
  memoria: MemoriaAssistenteOrquestrador;
}

const CAPACIDADES_CLIENTE = [
  'ACOES_LOCAIS_V1',
  'RESPOSTA_ESTRUTURADA_V2',
  'SUGESTOES_DINAMICAS_V1',
] as const;
const CACHE_TTL_MS = 20_000;
const requests = new Map<string, Promise<RespostaAssistenteOrquestrador | null>>();
const cache = new Map<string, {expiraEm: number; resposta: RespostaAssistenteOrquestrador}>();

/** Porta única do protocolo V2; falhas devolvem null para ativar o fluxo legado. */
export const conversarComAssistenteOrquestrador = async (
  client: AxiosInstance,
  params: ConversarComOrquestradorParams,
): Promise<RespostaAssistenteOrquestrador | null> => {
  const transcricoes = params.transcricoes
    .slice(0, 5)
    .map(texto => texto.replace(/\s+/g, ' ').trim().slice(0, 320))
    .filter(Boolean);
  const texto = transcricoes[0];
  if (!texto) return null;
  const requestKey = JSON.stringify({
    servidor: client.defaults.baseURL ?? 'strapi',
    texto: texto.toLocaleLowerCase('pt-BR'),
    tela: params.telaAtual ?? '',
    memoria: params.memoria,
  });
  const cached = cache.get(requestKey);
  if (cached && cached.expiraEm > Date.now()) return cached.resposta;
  if (cached) cache.delete(requestKey);
  const active = requests.get(requestKey);
  if (active) return active;

  const request = (async (): Promise<RespostaAssistenteOrquestrador | null> => {
    try {
      const response = await client.post<StrapiSingleResponse<unknown>>(
        '/assistente-ia/conversar',
        {
          protocolo: ASSISTENTE_PROTOCOL_VERSION,
          texto,
          transcricoes,
          ...(params.telaAtual ? {telaAtual: params.telaAtual} : {}),
          memoria: params.memoria,
          capacidadesCliente: CAPACIDADES_CLIENTE,
        },
        {timeout: 5_000, 'axios-retry': {retries: 0}},
      );
      const resposta = validarRespostaAssistenteOrquestrador(response.data.data);
      if (resposta?.processado) {
        cache.set(requestKey, {expiraEm: Date.now() + CACHE_TTL_MS, resposta});
        while (cache.size > 50) {
          const primeira = cache.keys().next().value;
          if (typeof primeira !== 'string') break;
          cache.delete(primeira);
        }
      }
      return resposta;
    } catch {
      return null;
    }
  })();
  requests.set(requestKey, request);
  return request.finally(() => {
    if (requests.get(requestKey) === request) requests.delete(requestKey);
  });
};

export const limparCacheAssistenteOrquestrador = (): void => {
  requests.clear();
  cache.clear();
};
