import fs from 'node:fs';
import path from 'node:path';

const TOOL_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(TOOL_ROOT, '..', '..');

/** Carrega variáveis locais da ferramenta sem incluí-las no bundle do Expo. */
const loadLocalEnv = (): void => {
  const envPath = path.join(TOOL_ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    if (!(key in process.env)) process.env[key] = value;
  }
};

loadLocalEnv();

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória não configurada: ${name}`);
  return value;
};

const normalizeApiUrl = (value: string): string => {
  const normalized = value.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const paths = {
  projectRoot: PROJECT_ROOT,
  toolRoot: TOOL_ROOT,
  output: path.join(TOOL_ROOT, 'output'),
};

export const getRemoteConfig = () => ({
  apiUrl: normalizeApiUrl(requireEnv('DATA_SYNC_STRAPI_URL')),
  token: requireEnv('DATA_SYNC_STRAPI_TOKEN'),
  timeoutMs: Number(process.env.DATA_SYNC_TIMEOUT_MS ?? 15_000),
  maxChanges: Number(process.env.DATA_SYNC_MAX_CHANGES ?? 1_000),
});
