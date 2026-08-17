export type JsonObject = Record<string, unknown>;

export interface StrapiRecord extends JsonObject {
  id?: number;
  documentId?: string;
}

export interface ChangePlan {
  key: string;
  action: 'create' | 'update' | 'skip' | 'invalid' | 'missing';
  documentId?: string;
  data?: JsonObject;
  changedFields?: string[];
  errors?: string[];
}

export interface SyncReport {
  resource: string;
  mode: 'check' | 'apply';
  startedAt: string;
  finishedAt: string;
  summary: Record<ChangePlan['action'] | 'failed', number>;
  changes: ChangePlan[];
  failures: Array<{key: string; message: string}>;
  sourceFile?: string;
  resolutions?: string[];
}
