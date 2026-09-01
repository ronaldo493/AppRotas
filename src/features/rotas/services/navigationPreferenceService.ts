import AsyncStorage from '@react-native-async-storage/async-storage';

import type {NavegadorRota} from '../../execucaoRota/models/ExecucaoRota';
export {resolverNavegadorRota} from '../useCases/resolverNavegadorRota';

interface HistoricoNavegadores {
  google: number;
  waze: number;
  ultimo: NavegadorRota | null;
}

const STORAGE_PREFIX = '@drogal:route-navigator:v1';
const HISTORICO_VAZIO: HistoricoNavegadores = {
  google: 0,
  waze: 0,
  ultimo: null,
};

const criarChave = (userKey: string): string =>
  `${STORAGE_PREFIX}:${userKey.replace(/[^a-zA-Z0-9_.:-]+/g, '_')}`;

const validarHistorico = (valor: unknown): HistoricoNavegadores => {
  if (!valor || typeof valor !== 'object') return {...HISTORICO_VAZIO};

  const registro = valor as Partial<HistoricoNavegadores>;
  return {
    google: Number.isFinite(registro.google)
      ? Math.max(0, Number(registro.google))
      : 0,
    waze: Number.isFinite(registro.waze)
      ? Math.max(0, Number(registro.waze))
      : 0,
    ultimo:
      registro.ultimo === 'google' || registro.ultimo === 'waze'
        ? registro.ultimo
        : null,
  };
};

/** Retorna o navegador usado com maior frequência e desempata pelo último. */
export const obterNavegadorPreferido = async (
  userKey: string | null,
): Promise<NavegadorRota | null> => {
  if (!userKey) return null;

  try {
    const salvo = await AsyncStorage.getItem(criarChave(userKey));
    const historico = validarHistorico(
      salvo ? JSON.parse(salvo) as unknown : null,
    );

    if (historico.google === 0 && historico.waze === 0) return null;
    if (historico.google === historico.waze) return historico.ultimo;

    return historico.google > historico.waze ? 'google' : 'waze';
  } catch {
    return null;
  }
};

/** Memoriza apenas aberturas concluídas, nunca uma escolha cancelada. */
export const registrarNavegadorUsado = async (
  userKey: string | null,
  navegador: NavegadorRota,
): Promise<void> => {
  if (!userKey) return;

  try {
    const chave = criarChave(userKey);
    const salvo = await AsyncStorage.getItem(chave);
    const historico = validarHistorico(
      salvo ? JSON.parse(salvo) as unknown : null,
    );
    historico[navegador] += 1;
    historico.ultimo = navegador;
    await AsyncStorage.setItem(chave, JSON.stringify(historico));
  } catch {
    // A preferência é uma conveniência e nunca pode impedir a navegação.
  }
};
