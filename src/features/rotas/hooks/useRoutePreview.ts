import axios from 'axios';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import type {LatLng} from 'react-native-maps';

import useStrapiClient from '../../../core/api/strapiClient';
import type {Filial} from '../../filiais/models/Filial';
import type {RoutePreview} from '../models/RoutePreview';
import {
  createRoutePreviewCacheKey,
  fetchRoutePreview,
  RoutePreviewValidationError,
} from '../services/routePreviewService';

interface UseRoutePreviewReturn {
  preview: RoutePreview | null;
  loading: boolean;
  error: string | null;
  loadPreview: (
    origin: LatLng,
    routes: readonly Filial[],
  ) => Promise<boolean>;
  resetPreview: () => void;
}

interface CachedPreview {
  key: string;
  data: RoutePreview;
}

interface ActivePreviewRequest {
  key: string;
  promise: Promise<RoutePreview>;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof RoutePreviewValidationError) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      'Não foi possível calcular a rota.'
    );
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível calcular a rota.';
};

/**
 * Controla a consulta da prévia e ignora respostas antigas quando o usuário
 * fecha a tela ou altera os destinos antes da requisição terminar.
 */
export default function useRoutePreview(): UseRoutePreviewReturn {
  const client = useStrapiClient();
  const requestIdRef = useRef(0);
  const cacheRef = useRef<CachedPreview | null>(
    null,
  );
  const activeRequestRef =
    useRef<ActivePreviewRequest | null>(null);
  const [preview, setPreview] =
    useState<RoutePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const loadPreview = useCallback(
    async (
      origin: LatLng,
      routes: readonly Filial[],
    ): Promise<boolean> => {
      const requestId = ++requestIdRef.current;
      const cacheKey =
        createRoutePreviewCacheKey(routes);
      const cachedPreview = cacheRef.current;

      if (cachedPreview?.key === cacheKey) {
        setPreview(cachedPreview.data);
        setError(null);
        setLoading(false);
        return true;
      }

      setLoading(true);
      setError(null);
      setPreview(null);

      try {
        let activeRequest =
          activeRequestRef.current;

        if (activeRequest?.key !== cacheKey) {
          const promise = fetchRoutePreview(
            client,
            origin,
            routes,
          );

          activeRequest = {
            key: cacheKey,
            promise,
          };
          activeRequestRef.current =
            activeRequest;
        }

        const result = await activeRequest.promise;

        if (requestId !== requestIdRef.current) {
          return false;
        }

        cacheRef.current = {
          key: cacheKey,
          data: result,
        };
        setPreview(result);
        return true;
      } catch (requestError: unknown) {
        if (requestId !== requestIdRef.current) {
          return false;
        }

        setError(getErrorMessage(requestError));
        return false;
      } finally {
        if (
          activeRequestRef.current?.key ===
          cacheKey
        ) {
          activeRequestRef.current = null;
        }

        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [client],
  );

  const resetPreview = useCallback((): void => {
    requestIdRef.current += 1;
    setPreview(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    preview,
    loading,
    error,
    loadPreview,
    resetPreview,
  };
}
