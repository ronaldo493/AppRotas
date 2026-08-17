import {getRemoteConfig} from './config';
import type {JsonObject, StrapiRecord} from './types';

interface StrapiListResponse {
  data?: StrapiRecord[];
  meta?: {pagination?: {pageCount?: number}};
}

const buildUrl = (path: string): string => {
  const {apiUrl} = getRemoteConfig();
  return `${apiUrl}/${path.replace(/^\/+/, '')}`;
};

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const {token, timeoutMs} = getRemoteConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildUrl(path), {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? {'Content-Type': 'application/json'} : {}),
        ...options.headers,
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : undefined;
    if (!response.ok) {
      const message = body?.error?.message ?? body?.message ?? text ?? response.statusText;
      throw new Error(`HTTP ${response.status}: ${message}`);
    }
    return body as T;
  } finally {
    clearTimeout(timeout);
  }
};

/** Lê todas as páginas publicadas para não comparar contra uma amostra parcial. */
export const listAll = async (endpoint: string): Promise<StrapiRecord[]> => {
  const records: StrapiRecord[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await request<StrapiListResponse>(
      `${endpoint}${separator}pagination[page]=${page}&pagination[pageSize]=100&status=published`,
    );
    records.push(...(response.data ?? []));
    pageCount = response.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);

  return records;
};

export const createRecord = async (
  endpoint: string,
  data: JsonObject,
): Promise<void> => {
  await request(`${endpoint}?status=published`, {
    method: 'POST',
    body: JSON.stringify({data}),
  });
};

export const updateRecord = async (
  endpoint: string,
  documentId: string,
  data: JsonObject,
): Promise<void> => {
  await request(`${endpoint}/${documentId}?status=published`, {
    method: 'PUT',
    body: JSON.stringify({data}),
  });
};

export const deleteRecord = async (
  endpoint: string,
  documentId: string,
): Promise<void> => {
  await request(`${endpoint}/${documentId}`, {method: 'DELETE'});
};

export const listUsers = async (): Promise<StrapiRecord[]> =>
  request<StrapiRecord[]>('users?populate=role&pagination[pageSize]=1000');

export const createUser = async (data: JsonObject): Promise<void> => {
  await request('users', {method: 'POST', body: JSON.stringify(data)});
};
