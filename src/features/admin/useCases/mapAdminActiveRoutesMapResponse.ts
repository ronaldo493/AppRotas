import type {
  AdminActiveRouteLocation,
  AdminActiveRoutesMapData,
  EstadoAtualizacaoRotaAtiva,
  TotaisAdminActiveRoutesMap,
} from '../models/AdminActiveRoutesMap';
import {rotaAtivaPossuiLocalizacao} from '../models/AdminActiveRoutesMap';

type JsonObject = Record<string, unknown>;

const asObject = (value: unknown): JsonObject =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNullableString = (value: unknown): string | null => {
  const normalized = asString(value).trim();
  return normalized || null;
};

const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = asNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const obterEstado = (
  raw: JsonObject,
  latitude: number | null,
  longitude: number | null,
): EstadoAtualizacaoRotaAtiva => {
  const value = asString(raw.estado).toLowerCase();
  if (
    value === 'aguardando_primeiro_lote' ||
    value === 'aguardando_dados' ||
    latitude === null || longitude === null
  ) return 'aguardando_primeiro_lote';
  if (value === 'atual') return 'atual';
  if (value === 'atrasada') return 'atrasada';
  if (value === 'sem_atualizacao') return 'sem_atualizacao';

  const idade = asNullableNumber(raw.idadeSegundos);
  if (idade !== null && idade <= 120) return 'atual';
  if (idade !== null && idade <= 900) return 'atrasada';
  return 'sem_atualizacao';
};

const mapearRota = (value: unknown): AdminActiveRouteLocation | null => {
  const raw = asObject(value);
  const codigoSessao = asString(raw.codigoSessao).trim();
  if (!codigoSessao) return null;

  const latitude = asNullableNumber(raw.latitude);
  const longitude = asNullableNumber(raw.longitude);
  const estado = obterEstado(raw, latitude, longitude);
  const aguardando = estado === 'aguardando_primeiro_lote';

  return {
    codigoSessao,
    usuarioId: typeof raw.usuarioId === 'string' || typeof raw.usuarioId === 'number'
      ? raw.usuarioId
      : null,
    username: asString(raw.username, 'Colaborador não informado'),
    setor: asString(raw.setor),
    iniciadaEm: asString(raw.iniciadaEm),
    latitude: aguardando ? null : latitude,
    longitude: aguardando ? null : longitude,
    precisaoMetros: aguardando
      ? null
      : asNullableNumber(raw.precisaoMetros),
    capturadaEm: aguardando
      ? null
      : asNullableString(raw.capturadaEm),
    recebidaEm: aguardando
      ? null
      : asNullableString(raw.recebidaEm),
    idadeSegundos: aguardando ? null : asNullableNumber(raw.idadeSegundos),
    estado,
    quantidadePontos: Math.max(0, asNumber(raw.quantidadePontos)),
    quantidadeDestinosPlanejados: Math.max(
      0,
      asNumber(raw.quantidadeDestinosPlanejados),
    ),
    quantidadeDestinosVisitados: Math.max(
      0,
      asNumber(raw.quantidadeDestinosVisitados),
    ),
  };
};

const calcularTotais = (
  rotas: AdminActiveRouteLocation[],
  raw: JsonObject,
): TotaisAdminActiveRoutesMap => {
  const calculados = {
    rotasEmAndamento: rotas.length,
    comLocalizacao: rotas.filter(rotaAtivaPossuiLocalizacao).length,
    aguardandoPrimeiroLote: rotas.filter(
      item => item.estado === 'aguardando_primeiro_lote',
    ).length,
    atual: rotas.filter(item => item.estado === 'atual').length,
    atrasada: rotas.filter(item => item.estado === 'atrasada').length,
    semAtualizacao: rotas.filter(item => item.estado === 'sem_atualizacao').length,
  };

  return {
    rotasEmAndamento: asNumber(
      raw.rotasEmAndamento,
      calculados.rotasEmAndamento,
    ),
    comLocalizacao: asNumber(
      raw.comLocalizacao,
      calculados.comLocalizacao,
    ),
    aguardandoPrimeiroLote: asNumber(
      raw.aguardandoPrimeiroLote,
      calculados.aguardandoPrimeiroLote,
    ),
    atual: asNumber(raw.atual, calculados.atual),
    atrasada: asNumber(raw.atrasada, calculados.atrasada),
    semAtualizacao: asNumber(
      raw.semAtualizacao,
      calculados.semAtualizacao,
    ),
  };
};

/** Valida e normaliza o contrato canônico do mapa de rotas ativas. */
export function mapearRespostaMapaRotasAtivas(
  value: unknown,
): AdminActiveRoutesMapData {
  const raw = asObject(value);
  const rawRoutes = Array.isArray(raw.rotas) ? raw.rotas : [];
  const rotas = rawRoutes
    .map(mapearRota)
    .filter((item): item is AdminActiveRouteLocation => item !== null);
  const scope = asObject(raw.escopo);
  const totals = asObject(raw.totais);

  return {
    geradoEm: asString(raw.geradoEm, new Date().toISOString()),
    escopo: {
      abrangencia: scope.abrangencia === 'proprio_setor'
        ? 'proprio_setor'
        : 'todos_setores',
      setor: asNullableString(scope.setor),
    },
    totais: calcularTotais(rotas, totals),
    rotas,
  };
}
