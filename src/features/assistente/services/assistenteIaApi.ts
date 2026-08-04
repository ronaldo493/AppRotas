import type {AxiosInstance} from 'axios';

import type {StrapiSingleResponse} from '../../../core/api/strapiTypes';
import {
  validarRespostaAssistenteIa,
  type RespostaAssistenteIa,
} from '../useCases/validarRespostaAssistenteIa';

export interface InteracaoRecenteAssistenteIa {
  textoUsuario: string;
  dominio?: string;
  acao?: string;
}

export interface ContextoConversaAssistenteIa {
  interacoesRecentes: readonly InteracaoRecenteAssistenteIa[];
  rotaAtual: readonly number[];
  possuiUltimoPonto: boolean;
  possuiUltimoContato: boolean;
  possuiUltimaFilial: boolean;
  ultimoDepartamento?: string;
}

interface SolicitarInterpretacaoParams {
  transcricoes: readonly string[];
  telaAtual?: string;
  contextoConversa: ContextoConversaAssistenteIa;
}

const RESPOSTA_VAZIA: RespostaAssistenteIa = {
  interpretado: false,
  comando: null,
  comandoCanonico: null,
  confianca: 0,
  precisaEsclarecimento: false,
  esclarecimento: null,
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
 * contexto de domínio permanecem no backend; o app envia alternativas da fala,
 * tela e uma memória curta sem respostas nem dados consultados.
 */
export const solicitarInterpretacaoAssistenteIa = async (
  client: AxiosInstance,
  params: SolicitarInterpretacaoParams,
): Promise<RespostaAssistenteIa> => {
  const transcricoes = params.transcricoes
    .slice(0, 5)
    .map(texto => texto.replace(/\s+/g, ' ').trim())
    .filter(texto => texto.length > 0 && texto.length <= 320);
  const texto = transcricoes[0] ?? '';
  if (!texto) return RESPOSTA_VAZIA;

  const serverKey = String(client.defaults.baseURL ?? 'strapi');
  if ((indisponivelAteByServer.get(serverKey) ?? 0) > Date.now()) {
    return RESPOSTA_VAZIA;
  }

  const assinaturaContexto = JSON.stringify({
    i: params.contextoConversa.interacoesRecentes.slice(-4),
    r: params.contextoConversa.rotaAtual.slice(0, 20),
    p: params.contextoConversa.possuiUltimoPonto,
    c: params.contextoConversa.possuiUltimoContato,
    f: params.contextoConversa.possuiUltimaFilial,
    d: params.contextoConversa.ultimoDepartamento ?? '',
  });
  const requestKey = [
    serverKey,
    params.telaAtual ?? '',
    transcricoes.join('|').toLocaleLowerCase('pt-BR'),
    assinaturaContexto,
  ].join('|');
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
          // `texto` mantém compatibilidade com um backend anterior durante o rollout.
          texto,
          transcricoes,
          ...(params.telaAtual ? {telaAtual: params.telaAtual} : {}),
          contextoConversa: params.contextoConversa,
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
