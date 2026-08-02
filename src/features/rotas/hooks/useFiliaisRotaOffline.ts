import {useEffect, useMemo, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import {useAuthContext} from '../../../core/auth/AuthContext';
import {getAuthUserKey} from '../../../core/auth/getAuthUserKey';
import useFiliais from '../../filiais/hooks/useFiliais';
import type {Filial} from '../../filiais/models/Filial';
import {
  lerFiliaisRotaCache,
  salvarFiliaisRotaCache,
  type FiliaisRotaCache,
} from '../services/filiaisRotaOfflineCache';
import {podeUsarCacheFiliaisRota} from '../useCases/validarCacheFiliaisRota';

interface UseFiliaisRotaOfflineReturn {
  filiais: Filial[];
  loading: boolean;
  error: string | null;
  usandoDadosSalvos: boolean;
  dadosOnlineIndisponiveis: boolean;
  cacheAtualizadoEm: number | null;
}

/**
 * Acrescenta fallback persistente somente à busca usada pela tela de Rotas.
 * Os demais módulos continuam dependendo dos dados online do contexto global.
 */
export default function useFiliaisRotaOffline(): UseFiliaisRotaOfflineReturn {
  const client = useStrapiClient();
  const {user} = useAuthContext();
  const userKey = getAuthUserKey(user);
  const {
    filiais: filiaisOnline,
    loading: loadingOnline,
    error: onlineError,
    errorStatus,
  } = useFiliais({showErrorToast: false});
  const [cached, setCached] = useState<FiliaisRotaCache | null>(null);
  const [loadingCache, setLoadingCache] = useState(true);

  useEffect(() => {
    let active = true;

    setCached(null);
    setLoadingCache(true);

    if (!userKey) {
      setLoadingCache(false);
      return () => {
        active = false;
      };
    }

    void lerFiliaisRotaCache(client, userKey).then(result => {
      if (!active) return;

      setCached(result);
      setLoadingCache(false);
    });

    return () => {
      active = false;
    };
  }, [client, userKey]);

  useEffect(() => {
    if (
      !userKey ||
      filiaisOnline.length === 0 ||
      loadingOnline ||
      onlineError
    ) {
      return;
    }

    void salvarFiliaisRotaCache(
      client,
      userKey,
      filiaisOnline,
    );
  }, [
    client,
    filiaisOnline,
    loadingOnline,
    onlineError,
    userKey,
  ]);

  return useMemo(() => {
    const cachePermitido =
      podeUsarCacheFiliaisRota(errorStatus) &&
      cached !== null;
    const usandoDadosSalvos =
      filiaisOnline.length === 0 &&
      cachePermitido;
    const filiais = usandoDadosSalvos
      ? cached.filiais
      : filiaisOnline;

    return {
      filiais,
      loading:
        filiais.length === 0 &&
        (loadingOnline || loadingCache),
      error:
        filiais.length > 0
          ? null
          : onlineError,
      usandoDadosSalvos,
      dadosOnlineIndisponiveis:
        usandoDadosSalvos && onlineError !== null,
      cacheAtualizadoEm: usandoDadosSalvos
        ? cached.atualizadoEm
        : null,
    };
  }, [
    cached,
    errorStatus,
    filiaisOnline,
    loadingCache,
    loadingOnline,
    onlineError,
  ]);
}
