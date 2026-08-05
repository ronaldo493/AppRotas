import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'drogal-route-monitoring.db';

export const TRACKING_POINT_RETENTION_DAYS = 7;
export const EXECUTION_RETENTION_DAYS = 30;

let databasePromise:
  | Promise<SQLite.SQLiteDatabase>
  | null = null;

/** Abre o SQLite uma única vez e garante que o schema esteja atualizado. */
export async function openRouteDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync(
        DATABASE_NAME,
      );

      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;

        CREATE TABLE IF NOT EXISTS route_executions (
          session_id TEXT PRIMARY KEY NOT NULL,
          device_session_code TEXT,
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

      `);

      const executionColumns = await database.getAllAsync<{name: string}>(
        'PRAGMA table_info(route_executions);',
      );

      if (!executionColumns.some(column => column.name === 'device_session_code')) {
        await database.execAsync(
          'ALTER TABLE route_executions ADD COLUMN device_session_code TEXT;',
        );
      }

      await database.execAsync('PRAGMA user_version = 3;');

      return database;
    })().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
