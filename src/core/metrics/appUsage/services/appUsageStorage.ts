import AsyncStorage from '@react-native-async-storage/async-storage';

import type {AppUsageDailyMetric} from '../models/AppUsageDailyMetric';

const PREFIXO_STORAGE = '@drogal:uso-app:';
const DIAS_RETIDOS = 14;

const chave = (usuarioChave: string): string =>
  PREFIXO_STORAGE + usuarioChave;

const parse = (valor: string | null): AppUsageDailyMetric[] => {
  if (!valor) return [];

  try {
    const dados = JSON.parse(valor) as unknown;
    return Array.isArray(dados)
      ? dados.filter((item): item is AppUsageDailyMetric =>
        Boolean(
          item &&
          typeof item === 'object' &&
          typeof (item as AppUsageDailyMetric).dataReferencia === 'string',
        ),
      )
      : [];
  } catch {
    return [];
  }
};

/** Lê somente o resumo diário pertencente ao usuário autenticado. */
export async function listarMetricasUsoAppPendentes(
  usuarioChave: string,
): Promise<AppUsageDailyMetric[]> {
  return parse(await AsyncStorage.getItem(chave(usuarioChave)));
}

/**
 * Persiste snapshots cumulativos. A mesma métrica pode ser enviada novamente
 * após falha de rede porque o backend aplica valores máximos, não incrementos.
 */
export async function salvarMetricaUsoAppPendente(
  usuarioChave: string,
  metrica: AppUsageDailyMetric,
): Promise<AppUsageDailyMetric[]> {
  const existentes = await listarMetricasUsoAppPendentes(usuarioChave);
  const anterior = existentes.find(
    item => item.dataReferencia === metrica.dataReferencia,
  );
  const consolidada: AppUsageDailyMetric = anterior
    ? {
      ...metrica,
      primeiraAtividadeEm:
        anterior.primeiraAtividadeEm < metrica.primeiraAtividadeEm
          ? anterior.primeiraAtividadeEm
          : metrica.primeiraAtividadeEm,
      ultimaAtividadeEm:
        anterior.ultimaAtividadeEm > metrica.ultimaAtividadeEm
          ? anterior.ultimaAtividadeEm
          : metrica.ultimaAtividadeEm,
      aberturas: Math.max(anterior.aberturas, metrica.aberturas),
      tempoPrimeiroPlanoSegundos: Math.max(
        anterior.tempoPrimeiroPlanoSegundos,
        metrica.tempoPrimeiroPlanoSegundos,
      ),
    }
    : metrica;
  const atualizadas = [
    ...existentes.filter(
      item => item.dataReferencia !== metrica.dataReferencia,
    ),
    consolidada,
  ]
    .sort((primeira, segunda) =>
      primeira.dataReferencia.localeCompare(segunda.dataReferencia),
    )
    .slice(-DIAS_RETIDOS);

  await AsyncStorage.setItem(
    chave(usuarioChave),
    JSON.stringify(atualizadas),
  );

  return atualizadas;
}
