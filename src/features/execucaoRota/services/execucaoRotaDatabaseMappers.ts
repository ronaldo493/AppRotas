import type {
  ExecucaoRota,
  PontoRastreamento,
  ResumoExecucaoRota,
  TipoOcorrenciaLocalizacao,
} from '../models/ExecucaoRota';

export interface ExecucaoRotaRow {
  session_id: string;
  device_session_code: string | null;
  owner_key: string;
  user_id: number | null;
  user_document_id: string | null;
  username: string;
  sector: string;
  status: string;
  navigator: string;
  started_at: string;
  finished_at: string | null;
  origin_city: string | null;
  origin_latitude: number;
  origin_longitude: number;
  destinations_json: string;
  planned_polyline: string | null;
  planned_distance_meters: number | null;
  planned_duration_seconds: number | null;
  finish_reason: string | null;
  last_location_at: string | null;
  app_version: string | null;
  server_document_id: string | null;
  start_synced: number;
  finish_synced: number;
  summary_json: string | null;
}

export interface PontoRastreamentoRow {
  id: number;
  session_id: string;
  sequence_number: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
  synced: number;
}

export interface ProgressoDestinoRow {
  destination_code: number;
  destination_order: number;
  consecutive_points: number;
  first_point_at: string | null;
  last_point_at: string | null;
  confirmed_at: string | null;
  visit_order: number | null;
  confirmation_latitude: number | null;
  confirmation_longitude: number | null;
  confirmation_distance_meters: number | null;
}

export interface OcorrenciaLocalizacaoRow {
  id: number;
  event_type: TipoOcorrenciaLocalizacao;
  detected_at: string;
  restored_at: string | null;
  duration_seconds: number | null;
}

const parseJson = <T>(
  value: string | null,
  fallback: T,
): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

/** Converte a representação relacional da execução para o domínio do app. */
export const mapExecutionRow = (
  row: ExecucaoRotaRow,
): ExecucaoRota => ({
  codigoSessao: row.session_id,
  sessaoDispositivoCodigo: row.device_session_code,
  ownerKey: row.owner_key,
  usuarioId: row.user_id,
  usuarioDocumentId: row.user_document_id,
  username: row.username,
  setor: row.sector,
  status: row.status as ExecucaoRota['status'],
  navegador: row.navigator as ExecucaoRota['navegador'],
  iniciadaEm: row.started_at,
  finalizadaEm: row.finished_at,
  cidadeOrigem: row.origin_city,
  origem: {
    latitude: row.origin_latitude,
    longitude: row.origin_longitude,
  },
  destinos: parseJson(row.destinations_json, []),
  trajetoPlanejado: row.planned_polyline,
  distanciaPlanejadaMetros:
    row.planned_distance_meters,
  duracaoPlanejadaSegundos:
    row.planned_duration_seconds,
  motivoFinalizacao:
    row.finish_reason as
      | ExecucaoRota['motivoFinalizacao']
      | null,
  ultimaLocalizacaoEm: row.last_location_at,
  versaoAplicativo: row.app_version,
  servidorDocumentId: row.server_document_id,
  inicioSincronizado: row.start_synced === 1,
  finalizacaoSincronizada:
    row.finish_synced === 1,
  resumo: parseJson<ResumoExecucaoRota | null>(
    row.summary_json,
    null,
  ),
});

/** Converte uma linha de GPS persistida para o contrato de rastreamento. */
export const mapPointRow = (
  row: PontoRastreamentoRow,
): PontoRastreamento => ({
  id: row.id,
  codigoSessao: row.session_id,
  sequencia: row.sequence_number,
  latitude: row.latitude,
  longitude: row.longitude,
  precisao: row.accuracy,
  velocidade: row.speed,
  direcao: row.heading,
  registradoEm: row.recorded_at,
  sincronizado: row.synced === 1,
});
