import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AxiosInstance} from 'axios';

export type OrigemMetricaAssistente =
  | 'LOCAL'
  | 'GEMINI'
  | 'BACKEND'
  | 'ATALHO';
export type ResultadoMetricaAssistente =
  | 'SUCESSO'
  | 'NAO_COMPREENDIDO'
  | 'ERRO'
  | 'ESCLARECIMENTO';
export type CanalEntradaAssistente =
  | 'VOZ'
  | 'TEXTO'
  | 'ATALHO'
  | 'SUGESTAO'
  | 'SISTEMA';
export type MotorResolucaoAssistente =
  | 'REACT_NATIVE_LOCAL'
  | 'STRAPI_DETERMINISTICO'
  | 'GEMINI'
  | 'FALLBACK';
export type ResultadoNegocioAssistente =
  | 'ENCONTRADO'
  | 'SEM_RESULTADO'
  | 'AMBIGUO'
  | 'NAO_COMPREENDIDO'
  | 'NAO_AUTORIZADO'
  | 'INDISPONIVEL'
  | 'NAO_APLICAVEL';

export interface RegistrarMetricaAssistenteParams {
  codigoInteracao?: string;
  tela: string;
  origemInterpretacao: OrigemMetricaAssistente;
  resultado: ResultadoMetricaAssistente;
  dominio: string;
  acao: string;
  tempoRespostaMs: number;
  versaoApp?: string;
  etapa?:
    | 'CLIENTE_ADOCAO'
    | 'CLIENTE_ENTRADA'
    | 'CLIENTE_RESPOSTA';
  canalEntrada?: CanalEntradaAssistente;
  motorResolucao?: MotorResolucaoAssistente;
  resultadoTecnico?: 'SUCESSO' | 'ERRO' | 'TIMEOUT' | 'REDE' | 'HTTP' | 'COTA' | 'VALIDACAO';
  resultadoNegocio?: ResultadoNegocioAssistente;
  ferramenta?: string;
  motivoFalha?: string;
}

interface EventoMetricaAssistente extends RegistrarMetricaAssistenteParams {
  codigoEvento: string;
  criadoEm: number;
}

const STORAGE_PREFIX = '@drogal:assistant-metrics:v2';
const MAXIMO_EVENTOS_PENDENTES = 100;
const RETENCAO_EVENTO_MS = 7 * 24 * 60 * 60_000;
const filasPorUsuario = new Map<string, Promise<void>>();

export const criarCodigoInteracaoAssistente = (): string =>
  `assist-int-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;

const criarCodigoEvento = (): string =>
  `assist-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 12)}`;

const chaveFila = (userKey?: string | null): string => {
  const identificador = String(userKey ?? 'usuario')
    .replace(/[^a-zA-Z0-9_.-]+/g, '_')
    .slice(0, 100);
  return `${STORAGE_PREFIX}:${identificador || 'usuario'}`;
};

const lerFila = async (chave: string): Promise<EventoMetricaAssistente[]> => {
  try {
    const valor = await AsyncStorage.getItem(chave);
    const itens = valor ? JSON.parse(valor) as unknown : [];
    if (!Array.isArray(itens)) return [];
    const limite = Date.now() - RETENCAO_EVENTO_MS;
    return itens
      .filter((item): item is EventoMetricaAssistente =>
        Boolean(
          item &&
          typeof item === 'object' &&
          typeof (item as EventoMetricaAssistente).codigoEvento === 'string' &&
          Number((item as EventoMetricaAssistente).criadoEm) >= limite,
        ),
      )
      .slice(-MAXIMO_EVENTOS_PENDENTES);
  } catch {
    return [];
  }
};

const salvarFila = async (
  chave: string,
  eventos: readonly EventoMetricaAssistente[],
): Promise<void> => {
  try {
    if (eventos.length === 0) {
      await AsyncStorage.removeItem(chave);
      return;
    }
    await AsyncStorage.setItem(
      chave,
      JSON.stringify(eventos.slice(-MAXIMO_EVENTOS_PENDENTES)),
    );
  } catch {
    // A métrica continua descartável se o armazenamento estiver indisponível.
  }
};

const enviarFila = async (
  client: AxiosInstance,
  chave: string,
  novoEvento: EventoMetricaAssistente,
): Promise<void> => {
  const fila = [...await lerFila(chave), novoEvento]
    .slice(-MAXIMO_EVENTOS_PENDENTES);

  for (let indice = 0; indice < fila.length; indice += 1) {
    const evento = fila[indice];
    try {
      const {criadoEm: _criadoEm, ...dados} = evento;
      await client.post('/metricas-assistente/registrar', dados, {
        timeout: 2_500,
        'axios-retry': {retries: 0},
      });
    } catch {
      await salvarFila(chave, fila.slice(indice));
      return;
    }
  }

  await salvarFila(chave, []);
};

/**
 * Registra telemetria sem bloquear a interface. Falhas transitórias entram em
 * uma fila curta, idempotente e isolada por usuário para sincronização futura.
 */
export const registrarMetricaAssistente = (
  client: AxiosInstance,
  params: RegistrarMetricaAssistenteParams,
  userKey?: string | null,
): void => {
  const tempoRespostaMs = Math.max(
    0,
    Math.min(120_000, Math.round(params.tempoRespostaMs)),
  );
  const evento: EventoMetricaAssistente = {
    codigoEvento: criarCodigoEvento(),
    ...params,
    tempoRespostaMs,
    criadoEm: Date.now(),
  };
  const chave = chaveFila(userKey);
  const anterior = filasPorUsuario.get(chave) ?? Promise.resolve();
  const atual = anterior
    .catch(() => undefined)
    .then(() => enviarFila(client, chave, evento));
  const sentinela = atual.then(() => undefined, () => undefined);
  filasPorUsuario.set(chave, sentinela);
  void sentinela.finally(() => {
    if (filasPorUsuario.get(chave) === sentinela) {
      filasPorUsuario.delete(chave);
    }
  });
};
