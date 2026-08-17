import type {JsonObject} from './types';

export const STORE_FIELDS = [
  'codigofilial', 'nomefilial', 'endereco', 'numero', 'cep', 'bairro',
  'nomecidade', 'numeroibge', 'uf', 'telefone', 'gerente', 'supervisor',
  'cnpj', 'horariofuncionamento', 'latitude', 'longitude',
] as const;

export const POINT_FIELDS = [
  'categoria', 'latitude', 'longitude', 'descricao', 'ativo',
  'usernameCriador', 'cidadePonto', 'setorCriador',
] as const;

export const CONTACT_FIELDS = [
  'departamento', 'colaboradores', 'ramal', 'ddr', 'email',
] as const;

export const sanitizeRecord = (
  source: JsonObject,
  allowedFields: readonly string[],
): JsonObject => Object.fromEntries(
  allowedFields
    .filter(field => Object.prototype.hasOwnProperty.call(source, field))
    .map(field => [field, source[field]]),
);

const validCoordinate = (value: unknown, min: number, max: number): boolean => {
  if (value === null || value === undefined || value === '') return true;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
};

export const validateStore = (record: JsonObject): string[] => {
  const errors: string[] = [];
  if (!Number.isInteger(Number(record.codigofilial)) || Number(record.codigofilial) <= 0) {
    errors.push('codigofilial inválido');
  }
  if (typeof record.nomefilial !== 'string' || !record.nomefilial.trim()) {
    errors.push('nomefilial obrigatório');
  }
  if (record.uf != null && !/^[A-Za-z]{2}$/.test(String(record.uf).trim())) {
    errors.push('uf inválida');
  }
  if (!validCoordinate(record.latitude, -90, 90)) errors.push('latitude inválida');
  if (!validCoordinate(record.longitude, -180, 180)) errors.push('longitude inválida');
  return errors;
};

export const validatePoint = (record: JsonObject): string[] => {
  const errors: string[] = [];
  if (typeof record.categoria !== 'string' || !record.categoria.trim()) {
    errors.push('categoria obrigatória');
  }
  if (typeof record.descricao !== 'string' || !record.descricao.trim()) {
    errors.push('descricao obrigatória');
  }
  if (!validCoordinate(record.latitude, -90, 90) || record.latitude == null) {
    errors.push('latitude inválida');
  }
  if (!validCoordinate(record.longitude, -180, 180) || record.longitude == null) {
    errors.push('longitude inválida');
  }
  return errors;
};

export const validateUser = (record: JsonObject): string[] => {
  const errors: string[] = [];
  if (typeof record.username !== 'string' || record.username.trim().length < 3) {
    errors.push('username inválido');
  }
  if (typeof record.email !== 'string' || !record.email.includes('@')) {
    errors.push('email inválido');
  }
  if (typeof record.setor !== 'string' || !record.setor.trim()) {
    errors.push('setor obrigatório');
  }
  return errors;
};

export const validateContact = (record: JsonObject): string[] => {
  const errors: string[] = [];
  if (typeof record.departamento !== 'string' || !record.departamento.trim()) {
    errors.push('departamento obrigatório');
  }
  if (typeof record.colaboradores !== 'string' || !record.colaboradores.trim()) {
    errors.push('colaboradores obrigatório');
  }
  return errors;
};
