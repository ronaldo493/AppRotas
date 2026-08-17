import type {ChangePlan, JsonObject, StrapiRecord} from './types';

const normalize = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed !== '' && Number.isFinite(Number(trimmed))) return Number(trimmed);
    return trimmed;
  }
  return value;
};

const changedFields = (current: JsonObject, incoming: JsonObject): string[] =>
  Object.keys(incoming).filter(field =>
    JSON.stringify(normalize(current[field])) !== JSON.stringify(normalize(incoming[field])),
  );

export const buildPlan = ({
  incoming,
  current,
  keyOf,
  validate,
  sanitize,
  includeMissing = false,
}: {
  incoming: JsonObject[];
  current: StrapiRecord[];
  keyOf: (record: JsonObject) => string;
  validate: (record: JsonObject) => string[];
  sanitize: (record: JsonObject) => JsonObject;
  includeMissing?: boolean;
}): ChangePlan[] => {
  const currentByKey = new Map(current.map(record => [keyOf(record), record]));
  const seen = new Set<string>();
  const incomingKeyCounts = incoming.reduce((counts, record) => {
    const key = keyOf(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  const plans: ChangePlan[] = incoming.map(record => {
    const key = keyOf(record);
    const errors = validate(record);
    if (!key) errors.push('chave do registro não informada');
    if ((incomingKeyCounts.get(key) ?? 0) > 1) {
      errors.push('chave duplicada no arquivo de entrada');
    }
    seen.add(key);

    if (errors.length) return {key: key || '(sem chave)', action: 'invalid', errors};

    const data = sanitize(record);
    const existing = currentByKey.get(key);
    if (!existing) return {key, action: 'create', data};

    const fields = changedFields(existing, data);
    if (!fields.length) return {key, action: 'skip', documentId: existing.documentId};
    if (!existing.documentId) {
      return {key, action: 'invalid', errors: ['registro remoto sem documentId']};
    }
    const changedData = Object.fromEntries(
      fields.map(field => [field, data[field]]),
    );
    return {
      key,
      action: 'update',
      documentId: existing.documentId,
      data: changedData,
      changedFields: fields,
    };
  });

  if (includeMissing) {
    for (const [key, record] of currentByKey) {
      if (!seen.has(key)) {
        plans.push({key, action: 'missing', documentId: record.documentId});
      }
    }
  }

  return plans;
};
