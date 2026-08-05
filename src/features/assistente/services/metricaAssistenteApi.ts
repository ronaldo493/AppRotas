import type {AxiosInstance} from 'axios';

export type OrigemMetricaAssistente = 'LOCAL' | 'GEMINI' | 'ATALHO';
export type ResultadoMetricaAssistente =
  | 'SUCESSO'
  | 'NAO_COMPREENDIDO'
  | 'ERRO'
  | 'ESCLARECIMENTO';

export interface RegistrarMetricaAssistenteParams {
  tela: string;
  origemInterpretacao: OrigemMetricaAssistente;
  resultado: ResultadoMetricaAssistente;
  dominio: string;
  acao: string;
  tempoRespostaMs: number;
  versaoApp?: string;
}

const criarCodigoEvento = (): string =>
  `assist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Envia somente dimensões técnicas e absorve qualquer falha. Telemetria nunca
 * participa da decisão do comando nem pode atrasar ou quebrar a assistente.
 */
export const registrarMetricaAssistente = (
  client: AxiosInstance,
  params: RegistrarMetricaAssistenteParams,
): void => {
  const tempoRespostaMs = Math.max(
    0,
    Math.min(120_000, Math.round(params.tempoRespostaMs)),
  );

  void client.post(
    '/metricas-assistente/registrar',
    {
      codigoEvento: criarCodigoEvento(),
      ...params,
      tempoRespostaMs,
    },
    {
      timeout: 2_500,
      'axios-retry': {retries: 0},
    },
  ).catch(() => {
    // Métricas são best effort: sem toast, retry ou log para o colaborador.
  });
};
