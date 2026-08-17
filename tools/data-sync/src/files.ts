import fs from 'node:fs';
import path from 'node:path';
import {paths} from './config';
import type {JsonObject, SyncReport} from './types';

export const resolveProjectPath = (filePath: string): string =>
  path.isAbsolute(filePath)
    ? filePath
    : path.resolve(paths.projectRoot, filePath);

export const readJsonArray = (filePath: string): JsonObject[] => {
  const absolutePath = resolveProjectPath(filePath);
  const parsed: unknown = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`O arquivo precisa conter uma lista JSON: ${absolutePath}`);
  }
  return parsed as JsonObject[];
};

export const writeJson = (filePath: string, value: unknown): string => {
  const absolutePath = resolveProjectPath(filePath);
  fs.mkdirSync(path.dirname(absolutePath), {recursive: true});
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return absolutePath;
};

export const writeReport = (report: SyncReport): string => {
  fs.mkdirSync(paths.output, {recursive: true});
  const stamp = report.finishedAt.replace(/[:.]/g, '-');
  return writeJson(
    path.join(paths.output, `${stamp}-${report.resource}-${report.mode}.json`),
    report,
  );
};
