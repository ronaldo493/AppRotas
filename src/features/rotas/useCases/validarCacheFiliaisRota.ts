import type {Filial} from '../../filiais/models/Filial';

export const FILIAIS_ROTA_CACHE_VERSION = 1;

export interface FiliaisRotaCachePayload {
  version: typeof FILIAIS_ROTA_CACHE_VERSION;
  atualizadoEm: number;
  filiais: Filial[];
}

export interface FiliaisRotaCache {
  atualizadoEm: number;
  filiais: Filial[];
}

/** Não usa dados locais para contornar uma negativa explícita do servidor. */
export const podeUsarCacheFiliaisRota = (
  errorStatus: number | null,
): boolean => errorStatus !== 401 && errorStatus !== 403;

const isFilial = (value: unknown): value is Filial => {
  if (!value || typeof value !== 'object') return false;

  const filial = value as Partial<Filial>;

  return (
    typeof filial.codigofilial === 'number' &&
    Number.isFinite(filial.codigofilial) &&
    typeof filial.nomefilial === 'string' &&
    typeof filial.nomecidade === 'string'
  );
};

/**
 * Valida o contrato persistido antes de devolver dados ao fluxo de rotas.
 * Caches antigos, corrompidos ou incompletos são ignorados silenciosamente.
 */
export const parseFiliaisRotaCache = (
  serialized: string,
): FiliaisRotaCache | null => {
  try {
    const parsed = JSON.parse(serialized) as Partial<FiliaisRotaCachePayload>;

    if (
      parsed.version !== FILIAIS_ROTA_CACHE_VERSION ||
      typeof parsed.atualizadoEm !== 'number' ||
      !Number.isFinite(parsed.atualizadoEm) ||
      !Array.isArray(parsed.filiais) ||
      parsed.filiais.length === 0 ||
      !parsed.filiais.every(isFilial)
    ) {
      return null;
    }

    return {
      atualizadoEm: parsed.atualizadoEm,
      filiais: parsed.filiais,
    };
  } catch {
    return null;
  }
};
