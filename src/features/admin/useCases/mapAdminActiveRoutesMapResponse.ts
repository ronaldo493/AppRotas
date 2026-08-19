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
  const value = asString(raw.estado ?? raw.statusAtualizacao).toLowerCase();
  if (
    value === 'aguardando_primeiro_lote' ||
    value === 'aguardando_dados' ||
    latitude === null || longitude === null
  ) return 'aguardando_primeiro_lote';
  if (value === 'atual') return 'atual';
  if (value === 'atrasada' || value === 'recente') return 'atrasada';
  if (value === 'sem_atualizacao' || value === 'desatualizada') {
    return 'sem_atualizacao';
  }

  const idade = asNullableNumber(raw.idadeSegundos);
  if (idade !== null && idade <= 120) return 'atual';
  if (idade !== null && idade <= 900) return 'atrasada';
  return 'sem_atualizacao';
};

const mapearRota = (value: unknown): AdminActiveRouteLocation | null => {
  const raw = asObject(value);
  const codigoSessao = asString(
    raw.codigoSessao ?? raw.codigo_execucao ?? raw.codigo,
  ).trim();
  if (!codigoSessao) return null;

  const latitude = asNullableNumber(raw.latitude ?? raw.ultimaLatitude);
  const longitude = asNullableNumber(raw.longitude ?? raw.ultimaLongitude);
  const estado = obterEstado(raw, latitude, longitude);
  const aguardando = estado === 'aguardando_primeiro_lote';

  return {
    codigoSessao,
    usuarioId: typeof raw.usuarioId === 'string' || typeof raw.usuarioId === 'number'
      ? raw.usuarioId
      : null,
    username: asString(raw.username ?? raw.colaborador, 'Colaborador não informado'),
    setor: asString(raw.setor),
    iniciadaEm: asString(raw.iniciadaEm),
    latitude: aguardando ? null : latitude,
    longitude: aguardando ? null : longitude,
    precisaoMetros: aguardando
      ? null
      : asNullableNumber(raw.precisaoMetros ?? raw.ultimaPrecisaoMetros),
    capturadaEm: aguardando
      ? null
      : asNullableString(raw.capturadaEm ?? raw.ultimaLocalizacaoEm),
    recebidaEm: aguardando
      ? null
      : asNullableString(raw.recebidaEm ?? raw.ultimaSincronizacaoEm),
    idadeSegundos: aguardando ? null : asNullableNumber(raw.idadeSegundos),
    estado,
    quantidadePontos: Math.max(0, asNumber(raw.quantidadePontos)),
    quantidadeDestinosPlanejados: Math.max(0, asNumber(
      raw.quantidadeDestinosPlanejados ?? raw.totalDestinos,
    )),
    quantidadeDestinosVisitados: Math.max(0, asNumber(
      raw.quantidadeDestinosVisitados ?? raw.destinosVisitados,
    )),
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
      raw.rotasEmAndamento ?? raw.totalEmAndamento ?? raw.totalRotas,
      calculados.rotasEmAndamento,
    ),
    comLocalizacao: asNumber(
      raw.comLocalizacao ?? raw.totalComPosicao,
      calculados.comLocalizacao,
    ),
    aguardandoPrimeiroLote: asNumber(
      raw.aguardandoPrimeiroLote ?? raw.aguardandoDados ?? raw.totalAguardando,
      calculados.aguardandoPrimeiroLote,
    ),
    atual: asNumber(raw.atual, calculados.atual),
    atrasada: asNumber(raw.atrasada ?? raw.recente, calculados.atrasada),
    semAtualizacao: asNumber(
      raw.semAtualizacao ?? raw.desatualizada,
      calculados.semAtualizacao,
    ),
  };
};

/** Normaliza o contrato novo e mantém leitura transitória do envelope legado. */
export function mapearRespostaMapaRotasAtivas(
  value: unknown,
): AdminActiveRoutesMapData {
  const raw = asObject(value);
  const rawRoutes = Array.isArray(raw.rotas)
    ? raw.rotas
    : Array.isArray(raw.execucoes)
      ? raw.execucoes
      : Array.isArray(raw.colaboradores)
        ? raw.colaboradores
        : [];
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
