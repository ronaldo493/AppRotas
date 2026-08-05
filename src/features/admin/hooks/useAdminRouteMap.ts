import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {AdminRouteMapData} from '../models/AdminRouteMap';
import {consultarAdminRouteMap} from '../services/adminRouteMapApi';

const obterMensagemErro = (erro: unknown): string => {
  const requestError = erro as StrapiRequestError;
  if (requestError.response?.status === 403) {
    return 'Seu usuário não possui acesso a este percurso.';
  }
  if (requestError.response?.status === 404) {
    return 'O trajeto não foi encontrado ou ainda não foi sincronizado.';
  }

  return requestError.response?.data?.error?.message
    ?? requestError.response?.data?.message
    ?? 'Não foi possível carregar o trajeto agora.';
};

/** Controla a consulta sob demanda e ignora respostas de um mapa já fechado. */
export default function useAdminRouteMap(codigoSessao: string | null) {
  const client = useStrapiClient();
  const [data, setData] = useState<AdminRouteMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    codigoSessao: string;
    message: string;
  } | null>(null);
  const requestIdRef = useRef(0);

  const carregar = useCallback(async (): Promise<void> => {
    if (!codigoSessao) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await consultarAdminRouteMap(client, codigoSessao);
      if (requestId === requestIdRef.current) setData(response);
    } catch (erro: unknown) {
      if (requestId === requestIdRef.current) {
        setData(null);
        setError({codigoSessao, message: obterMensagemErro(erro)});
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [client, codigoSessao]);

  useEffect(() => {
    if (!codigoSessao) {
      requestIdRef.current += 1;
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setData(null);
    void carregar();

    return () => {
      requestIdRef.current += 1;
    };
  }, [carregar, codigoSessao]);

  const dataAtual = data?.codigoSessao === codigoSessao ? data : null;
  const errorAtual = error?.codigoSessao === codigoSessao
    ? error.message
    : null;
  return {data: dataAtual, loading, error: errorAtual, retry: carregar};
}
