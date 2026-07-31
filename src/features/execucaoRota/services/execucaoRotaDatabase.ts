import * as SQLite from 'expo-sqlite';

import {
  STATUS_EXECUCAO_ROTA,
  type ExecucaoRota,
  type MotivoFinalizacaoRota,
  type NovoPontoRastreamento,
  type OcorrenciaLocalizacaoRota,
  type PlanejamentoExecucaoRota,
  type PontoRastreamento,
  type ResumoExecucaoRota,
  type StatusExecucaoRota,
  type TipoOcorrenciaLocalizacao,
  type VisitaDestinoRota,
} from '../models/ExecucaoRota';
import {
  processarProgressoVisitasDestinos,
  type ProgressoVisitaDestinoRota,
} from '../useCases/confirmarVisitasDestinos';

const DATABASE_NAME = 'drogal-route-monitoring.db';
const TRACKING_POINT_RETENTION_DAYS = 7;
const EXECUTION_RETENTION_DAYS = 30;

interface ExecucaoRotaRow {
  session_id: string;
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

interface PontoRastreamentoRow {
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

interface ProgressoDestinoRow {
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

interface OcorrenciaLocalizacaoRow {
  id: number;
  event_type: TipoOcorrenciaLocalizacao;
  detected_at: string;
  restored_at: string | null;
  duration_seconds: number | null;
}

export interface ResultadoAdicaoPontosRastreamento {
  codigoSessao: string | null;
  quantidade: number;
  pontos: PontoRastreamento[];
}

let databasePromise:
  | Promise<SQLite.SQLiteDatabase>
  | null = null;

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

const mapExecutionRow = (
  row: ExecucaoRotaRow,
): ExecucaoRota => ({
  codigoSessao: row.session_id,
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

const mapPointRow = (
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

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync(
        DATABASE_NAME,
      );

      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS route_executions (
          session_id TEXT PRIMARY KEY NOT NULL,
          owner_key TEXT NOT NULL,
          user_id INTEGER,
          user_document_id TEXT,
          username TEXT NOT NULL,
          sector TEXT NOT NULL,
          status TEXT NOT NULL,
          navigator TEXT NOT NULL,
          started_at TEXT NOT NULL,
          finished_at TEXT,
          origin_city TEXT,
          origin_latitude REAL NOT NULL,
          origin_longitude REAL NOT NULL,
          destinations_json TEXT NOT NULL,
          planned_polyline TEXT,
          planned_distance_meters REAL,
          planned_duration_seconds INTEGER,
          finish_reason TEXT,
          last_location_at TEXT,
          app_version TEXT,
          server_document_id TEXT,
          start_synced INTEGER NOT NULL DEFAULT 0,
          finish_synced INTEGER NOT NULL DEFAULT 0,
          summary_json TEXT
        );

        CREATE TABLE IF NOT EXISTS route_tracking_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          sequence_number INTEGER NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          accuracy REAL,
          speed REAL,
          heading REAL,
          recorded_at TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY (session_id)
            REFERENCES route_executions(session_id)
            ON DELETE CASCADE,
          UNIQUE(session_id, recorded_at, latitude, longitude)
        );

        CREATE TABLE IF NOT EXISTS route_destination_progress (
          session_id TEXT NOT NULL,
          destination_code INTEGER NOT NULL,
          destination_order INTEGER NOT NULL,
          consecutive_points INTEGER NOT NULL DEFAULT 0,
          first_point_at TEXT,
          last_point_at TEXT,
          confirmed_at TEXT,
          visit_order INTEGER,
          confirmation_latitude REAL,
          confirmation_longitude REAL,
          confirmation_distance_meters REAL,
          PRIMARY KEY (session_id, destination_order),
          FOREIGN KEY (session_id)
            REFERENCES route_executions(session_id)
            ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS route_location_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          event_type TEXT NOT NULL,
          detected_at TEXT NOT NULL,
          restored_at TEXT,
          duration_seconds INTEGER,
          FOREIGN KEY (session_id)
            REFERENCES route_executions(session_id)
            ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS
          idx_route_executions_owner_status
          ON route_executions(owner_key, status);

        CREATE UNIQUE INDEX IF NOT EXISTS
          idx_route_executions_single_active
          ON route_executions(status)
          WHERE status = 'em_andamento';

        CREATE INDEX IF NOT EXISTS
          idx_route_tracking_points_pending
          ON route_tracking_points(session_id, synced, sequence_number);

        CREATE INDEX IF NOT EXISTS
          idx_route_location_events_session
          ON route_location_events(session_id, restored_at);

        PRAGMA user_version = 2;
      `);

      return database;
    })().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

/**
 * Inicializa o banco antecipadamente para que falhas sejam percebidas antes
 * de o usuário começar uma viagem.
 */
export async function inicializarBancoExecucaoRota(): Promise<void> {
  await openDatabase();
  await limparDadosSincronizadosExecucaoRota();
}

/**
 * Persiste primeiro a sessão local. Assim o rastreamento pode começar mesmo
 * quando o Strapi estiver temporariamente indisponível.
 */
export async function salvarExecucaoRota(
  execution: ExecucaoRota,
): Promise<void> {
  const database = await openDatabase();

  await database.runAsync(
    `
      INSERT INTO route_executions (
        session_id,
        owner_key,
        user_id,
        user_document_id,
        username,
        sector,
        status,
        navigator,
        started_at,
        finished_at,
        origin_city,
        origin_latitude,
        origin_longitude,
        destinations_json,
        planned_polyline,
        planned_distance_meters,
        planned_duration_seconds,
        finish_reason,
        last_location_at,
        app_version,
        server_document_id,
        start_synced,
        finish_synced,
        summary_json
      ) VALUES (
        $sessionId,
        $ownerKey,
        $userId,
        $userDocumentId,
        $username,
        $sector,
        $status,
        $navigator,
        $startedAt,
        $finishedAt,
        $originCity,
        $originLatitude,
        $originLongitude,
        $destinationsJson,
        $plannedPolyline,
        $plannedDistanceMeters,
        $plannedDurationSeconds,
        $finishReason,
        $lastLocationAt,
        $appVersion,
        $serverDocumentId,
        $startSynced,
        $finishSynced,
        $summaryJson
      )
    `,
    {
      $sessionId: execution.codigoSessao,
      $ownerKey: execution.ownerKey,
      $userId: execution.usuarioId,
      $userDocumentId:
        execution.usuarioDocumentId,
      $username: execution.username,
      $sector: execution.setor,
      $status: execution.status,
      $navigator: execution.navegador,
      $startedAt: execution.iniciadaEm,
      $finishedAt: execution.finalizadaEm,
      $originCity: execution.cidadeOrigem,
      $originLatitude: execution.origem.latitude,
      $originLongitude: execution.origem.longitude,
      $destinationsJson: JSON.stringify(
        execution.destinos,
      ),
      $plannedPolyline:
        execution.trajetoPlanejado,
      $plannedDistanceMeters:
        execution.distanciaPlanejadaMetros,
      $plannedDurationSeconds:
        execution.duracaoPlanejadaSegundos,
      $finishReason:
        execution.motivoFinalizacao,
      $lastLocationAt:
        execution.ultimaLocalizacaoEm,
      $appVersion: execution.versaoAplicativo,
      $serverDocumentId:
        execution.servidorDocumentId,
      $startSynced:
        execution.inicioSincronizado ? 1 : 0,
      $finishSynced:
        execution.finalizacaoSincronizada ? 1 : 0,
      $summaryJson: execution.resumo
        ? JSON.stringify(execution.resumo)
        : null,
    },
  );

  await database.withExclusiveTransactionAsync(
    async transaction => {
      for (const destination of execution.destinos) {
        await transaction.runAsync(
          `
            INSERT OR IGNORE INTO route_destination_progress (
              session_id,
              destination_code,
              destination_order
            ) VALUES (?, ?, ?)
          `,
          execution.codigoSessao,
          destination.codigo,
          destination.ordem,
        );
      }
    },
  );
}

export async function obterExecucaoRota(
  codigoSessao: string,
): Promise<ExecucaoRota | null> {
  const database = await openDatabase();
  const row =
    await database.getFirstAsync<ExecucaoRotaRow>(
      `
        SELECT *
        FROM route_executions
        WHERE session_id = ?
        LIMIT 1
      `,
      codigoSessao,
    );

  return row ? mapExecutionRow(row) : null;
}

/**
 * Retorna a única sessão ativa do aparelho. A regra de negócio impede que
 * duas viagens sejam monitoradas ao mesmo tempo.
 */
export async function obterExecucaoRotaAtiva(): Promise<ExecucaoRota | null> {
  const database = await openDatabase();
  const row =
    await database.getFirstAsync<ExecucaoRotaRow>(
      `
        SELECT *
        FROM route_executions
        WHERE status = ?
        ORDER BY started_at DESC
        LIMIT 1
      `,
      STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
    );

  return row ? mapExecutionRow(row) : null;
}

export async function atualizarPlanejamentoExecucaoRota(
  codigoSessao: string,
  planning: PlanejamentoExecucaoRota,
): Promise<void> {
  const database = await openDatabase();

  await database.runAsync(
    `
      UPDATE route_executions
      SET
        server_document_id = ?,
        planned_polyline = ?,
        planned_distance_meters = ?,
        planned_duration_seconds = ?,
        start_synced = 1
      WHERE session_id = ?
    `,
    planning.servidorDocumentId,
    planning.trajetoPlanejado,
    planning.distanciaPlanejadaMetros,
    planning.duracaoPlanejadaSegundos,
    codigoSessao,
  );
}

/**
 * Insere um lote do GPS em uma transação exclusiva e numera os pontos na
 * ordem de captura. Duplicatas entregues pelo sistema operacional são
 * ignoradas pelo índice único.
 */
export async function adicionarPontosRastreamento(
  points: readonly NovoPontoRastreamento[],
): Promise<ResultadoAdicaoPontosRastreamento> {
  if (points.length === 0) {
    return {
      codigoSessao: null,
      quantidade: 0,
      pontos: [],
    };
  }

  const database = await openDatabase();
  let activeSessionId: string | null = null;
  const insertedPoints: PontoRastreamento[] = [];

  await database.withExclusiveTransactionAsync(
    async transaction => {
      const activeExecution =
        await transaction.getFirstAsync<{
          session_id: string;
        }>(
          `
            SELECT session_id
            FROM route_executions
            WHERE status = ?
            ORDER BY started_at DESC
            LIMIT 1
          `,
          STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
        );

      if (!activeExecution) return;
      activeSessionId = activeExecution.session_id;

      const lastSequence =
        await transaction.getFirstAsync<{
          maximum_sequence: number | null;
        }>(
          `
            SELECT MAX(sequence_number) AS maximum_sequence
            FROM route_tracking_points
            WHERE session_id = ?
          `,
          activeExecution.session_id,
        );
      let sequence =
        (lastSequence?.maximum_sequence ?? 0) + 1;
      let latestLocationDate: string | null = null;

      for (const point of points) {
        const result = await transaction.runAsync(
          `
            INSERT OR IGNORE INTO route_tracking_points (
              session_id,
              sequence_number,
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
              recorded_at,
              synced
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
          `,
          activeExecution.session_id,
          sequence,
          point.latitude,
          point.longitude,
          point.precisao,
          point.velocidade,
          point.direcao,
          point.registradoEm,
        );

        if (result.changes > 0) {
          insertedPoints.push({
            id: result.lastInsertRowId,
            codigoSessao:
              activeExecution.session_id,
            sequencia: sequence,
            latitude: point.latitude,
            longitude: point.longitude,
            precisao: point.precisao,
            velocidade: point.velocidade,
            direcao: point.direcao,
            registradoEm: point.registradoEm,
            sincronizado: false,
          });
          sequence += 1;
          latestLocationDate = point.registradoEm;
        }
      }

      if (latestLocationDate) {
        await transaction.runAsync(
          `
            UPDATE route_executions
            SET last_location_at = ?
            WHERE session_id = ?
          `,
          latestLocationDate,
          activeExecution.session_id,
        );
      }
    },
  );

  return {
    codigoSessao: activeSessionId,
    quantidade: insertedPoints.length,
    pontos: insertedPoints,
  };
}

const mapDestinationProgress = (
  row: ProgressoDestinoRow,
): ProgressoVisitaDestinoRota => ({
  codigo: row.destination_code,
  ordemPlanejada: row.destination_order,
  pontosConsecutivos: row.consecutive_points,
  primeiroPontoEm: row.first_point_at,
  ultimoPontoEm: row.last_point_at,
  visita:
    row.confirmed_at !== null &&
    row.visit_order !== null &&
    row.confirmation_latitude !== null &&
    row.confirmation_longitude !== null &&
    row.confirmation_distance_meters !== null
      ? {
          codigo: row.destination_code,
          ordemPlanejada: row.destination_order,
          ordemVisita: row.visit_order,
          confirmadoEm: row.confirmed_at,
          latitudeConfirmacao:
            row.confirmation_latitude,
          longitudeConfirmacao:
            row.confirmation_longitude,
          distanciaConfirmacaoMetros:
            row.confirmation_distance_meters,
        }
      : null,
});

/**
 * Atualiza apenas o estado incremental de chegada. O histórico completo de
 * pontos continua independente e é usado para recalcular o resumo final.
 */
export async function atualizarProgressoDestinos(
  codigoSessao: string,
  novosPontos: readonly PontoRastreamento[],
): Promise<VisitaDestinoRota[]> {
  if (novosPontos.length === 0) return [];

  const database = await openDatabase();
  const execution = await obterExecucaoRota(
    codigoSessao,
  );

  if (
    !execution ||
    execution.status !==
      STATUS_EXECUCAO_ROTA.EM_ANDAMENTO
  ) {
    return [];
  }

  let confirmedVisits: VisitaDestinoRota[] = [];

  await database.withExclusiveTransactionAsync(
    async transaction => {
      for (const destination of execution.destinos) {
        await transaction.runAsync(
          `
            INSERT OR IGNORE INTO route_destination_progress (
              session_id,
              destination_code,
              destination_order
            ) VALUES (?, ?, ?)
          `,
          codigoSessao,
          destination.codigo,
          destination.ordem,
        );
      }

      const rows =
        await transaction.getAllAsync<ProgressoDestinoRow>(
          `
            SELECT
              destination_code,
              destination_order,
              consecutive_points,
              first_point_at,
              last_point_at,
              confirmed_at,
              visit_order,
              confirmation_latitude,
              confirmation_longitude,
              confirmation_distance_meters
            FROM route_destination_progress
            WHERE session_id = ?
            ORDER BY destination_order ASC
          `,
          codigoSessao,
        );
      const progress =
        processarProgressoVisitasDestinos(
          novosPontos,
          execution.destinos,
          rows.map(mapDestinationProgress),
        );

      for (const item of progress) {
        await transaction.runAsync(
          `
            UPDATE route_destination_progress
            SET
              consecutive_points = ?,
              first_point_at = ?,
              last_point_at = ?,
              confirmed_at = ?,
              visit_order = ?,
              confirmation_latitude = ?,
              confirmation_longitude = ?,
              confirmation_distance_meters = ?
            WHERE session_id = ?
              AND destination_order = ?
          `,
          item.pontosConsecutivos,
          item.primeiroPontoEm,
          item.ultimoPontoEm,
          item.visita?.confirmadoEm ?? null,
          item.visita?.ordemVisita ?? null,
          item.visita?.latitudeConfirmacao ?? null,
          item.visita?.longitudeConfirmacao ?? null,
          item.visita?.distanciaConfirmacaoMetros ??
            null,
          codigoSessao,
          item.ordemPlanejada,
        );
      }

      confirmedVisits = progress
        .flatMap(item =>
          item.visita ? [item.visita] : [],
        )
        .sort(
          (first, second) =>
            first.ordemVisita -
            second.ordemVisita,
        );
    },
  );

  return confirmedVisits;
}

/**
 * Registra uma indisponibilidade apenas uma vez enquanto ela permanecer
 * aberta. Mudanças de motivo encerram a ocorrência anterior.
 */
export async function registrarIndisponibilidadeLocalizacao(
  codigoSessao: string,
  tipo: TipoOcorrenciaLocalizacao,
  detectadaEm = new Date().toISOString(),
): Promise<void> {
  const database = await openDatabase();

  await database.withExclusiveTransactionAsync(
    async transaction => {
      const openEvent =
        await transaction.getFirstAsync<OcorrenciaLocalizacaoRow>(
          `
            SELECT *
            FROM route_location_events
            WHERE session_id = ?
              AND restored_at IS NULL
            ORDER BY detected_at DESC
            LIMIT 1
          `,
          codigoSessao,
        );

      if (openEvent?.event_type === tipo) return;

      if (openEvent) {
        const durationSeconds = Math.max(
          0,
          Math.round(
            (new Date(detectadaEm).getTime() -
              new Date(
                openEvent.detected_at,
              ).getTime()) /
              1_000,
          ),
        );

        await transaction.runAsync(
          `
            UPDATE route_location_events
            SET restored_at = ?, duration_seconds = ?
            WHERE id = ?
          `,
          detectadaEm,
          durationSeconds,
          openEvent.id,
        );
      }

      await transaction.runAsync(
        `
          INSERT INTO route_location_events (
            session_id,
            event_type,
            detected_at
          ) VALUES (?, ?, ?)
        `,
        codigoSessao,
        tipo,
        detectadaEm,
      );
    },
  );
}

export async function normalizarLocalizacaoExecucao(
  codigoSessao: string,
  normalizadaEm = new Date().toISOString(),
): Promise<void> {
  const database = await openDatabase();
  const openEvents =
    await database.getAllAsync<OcorrenciaLocalizacaoRow>(
      `
        SELECT *
        FROM route_location_events
        WHERE session_id = ?
          AND restored_at IS NULL
      `,
      codigoSessao,
    );

  for (const event of openEvents) {
    const durationSeconds = Math.max(
      0,
      Math.round(
        (new Date(normalizadaEm).getTime() -
          new Date(event.detected_at).getTime()) /
          1_000,
      ),
    );

    await database.runAsync(
      `
        UPDATE route_location_events
        SET restored_at = ?, duration_seconds = ?
        WHERE id = ?
      `,
      normalizadaEm,
      durationSeconds,
      event.id,
    );
  }
}

export async function listarOcorrenciasLocalizacao(
  codigoSessao: string,
): Promise<OcorrenciaLocalizacaoRota[]> {
  const database = await openDatabase();
  const rows =
    await database.getAllAsync<OcorrenciaLocalizacaoRow>(
      `
        SELECT *
        FROM route_location_events
        WHERE session_id = ?
        ORDER BY detected_at ASC
      `,
      codigoSessao,
    );

  return rows.map(row => ({
    id: row.id,
    tipo: row.event_type,
    detectadaEm: row.detected_at,
    normalizadaEm: row.restored_at,
    duracaoSegundos: row.duration_seconds,
  }));
}

export async function listarPontosExecucaoRota(
  codigoSessao: string,
  options: {
    somentePendentes?: boolean;
    limite?: number;
  } = {},
): Promise<PontoRastreamento[]> {
  const database = await openDatabase();
  const onlyPending = options.somentePendentes ?? false;
  const limit = Math.max(
    1,
    Math.min(options.limite ?? 10_000, 10_000),
  );
  const rows =
    await database.getAllAsync<PontoRastreamentoRow>(
      `
        SELECT *
        FROM route_tracking_points
        WHERE session_id = ?
          ${onlyPending ? 'AND synced = 0' : ''}
        ORDER BY sequence_number ASC
        LIMIT ?
      `,
      codigoSessao,
      limit,
    );

  return rows.map(mapPointRow);
}

export async function marcarPontosComoSincronizados(
  pointIds: readonly number[],
): Promise<void> {
  if (pointIds.length === 0) return;

  const database = await openDatabase();
  const placeholders = pointIds.map(() => '?').join(',');

  await database.runAsync(
    `
      UPDATE route_tracking_points
      SET synced = 1
      WHERE id IN (${placeholders})
    `,
    [...pointIds],
  );
}

export async function finalizarExecucaoRotaLocal(
  codigoSessao: string,
  status: Exclude<
    StatusExecucaoRota,
    typeof STATUS_EXECUCAO_ROTA.EM_ANDAMENTO
  >,
  motivo: MotivoFinalizacaoRota,
  finalizadaEm: string,
  resumo: ResumoExecucaoRota,
): Promise<void> {
  const database = await openDatabase();

  await database.runAsync(
    `
      UPDATE route_executions
      SET
        status = ?,
        finished_at = ?,
        finish_reason = ?,
        summary_json = ?,
        finish_synced = 0
      WHERE session_id = ?
        AND status = ?
    `,
    status,
    finalizadaEm,
    motivo,
    JSON.stringify(resumo),
    codigoSessao,
    STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
  );
}

export async function salvarResumoExecucaoRota(
  codigoSessao: string,
  resumo: ResumoExecucaoRota,
): Promise<void> {
  const database = await openDatabase();

  await database.runAsync(
    `
      UPDATE route_executions
      SET summary_json = ?
      WHERE session_id = ?
    `,
    JSON.stringify(resumo),
    codigoSessao,
  );
}

export async function marcarFinalizacaoSincronizada(
  codigoSessao: string,
): Promise<void> {
  const database = await openDatabase();

  await database.runAsync(
    `
      UPDATE route_executions
      SET finish_synced = 1
      WHERE session_id = ?
    `,
    codigoSessao,
  );
}

/**
 * Lista somente sessões que possuem algo a enviar. Cada consulta permanece
 * limitada ao proprietário autenticado.
 */
export async function listarExecucoesPendentes(
  ownerKey: string,
): Promise<ExecucaoRota[]> {
  const database = await openDatabase();
  const rows =
    await database.getAllAsync<ExecucaoRotaRow>(
      `
        SELECT execution.*
        FROM route_executions AS execution
        WHERE execution.owner_key = ?
          AND (
            execution.start_synced = 0
            OR (
              execution.status <> ?
              AND execution.finish_synced = 0
            )
            OR EXISTS (
              SELECT 1
              FROM route_tracking_points AS point
              WHERE point.session_id = execution.session_id
                AND point.synced = 0
            )
          )
        ORDER BY execution.started_at ASC
      `,
      ownerKey,
      STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
    );

  return rows.map(mapExecutionRow);
}

/**
 * Remove somente dados já confirmados pelo servidor. Pontos pendentes e
 * execuções em andamento nunca participam da limpeza automática.
 */
export async function limparDadosSincronizadosExecucaoRota(
  referencia = new Date(),
): Promise<void> {
  const database = await openDatabase();
  const pointCutoff = new Date(
    referencia.getTime() -
      TRACKING_POINT_RETENTION_DAYS *
        24 *
        60 *
        60 *
        1_000,
  ).toISOString();
  const executionCutoff = new Date(
    referencia.getTime() -
      EXECUTION_RETENTION_DAYS *
        24 *
        60 *
        60 *
        1_000,
  ).toISOString();

  await database.withExclusiveTransactionAsync(
    async transaction => {
      await transaction.runAsync(
        `
          DELETE FROM route_tracking_points
          WHERE synced = 1
            AND session_id IN (
              SELECT execution.session_id
              FROM route_executions AS execution
              WHERE execution.status <> ?
                AND execution.finish_synced = 1
                AND execution.finished_at <= ?
                AND NOT EXISTS (
                  SELECT 1
                  FROM route_tracking_points AS pending
                  WHERE pending.session_id =
                    execution.session_id
                    AND pending.synced = 0
                )
            )
        `,
        STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
        pointCutoff,
      );

      await transaction.runAsync(
        `
          DELETE FROM route_executions
          WHERE status <> ?
            AND finish_synced = 1
            AND finished_at <= ?
            AND NOT EXISTS (
              SELECT 1
              FROM route_tracking_points AS pending
              WHERE pending.session_id =
                route_executions.session_id
                AND pending.synced = 0
            )
        `,
        STATUS_EXECUCAO_ROTA.EM_ANDAMENTO,
        executionCutoff,
      );
    },
  );

  await database.execAsync('PRAGMA optimize;');
}
