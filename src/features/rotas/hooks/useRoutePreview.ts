import axios from 'axios';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import type {LatLng} from 'react-native-maps';

import useStrapiClient from '../../../core/api/strapiClient';
import {capturarLocalizacaoAtual} from '../../../core/location/services/locationSnapshotService';
import {appLogger} from '../../../shared/logging/appLogger';
import type {Filial} from '../../filiais/models/Filial';
import type {RoutePreview} from '../models/RoutePreview';
import {
  createRoutePreviewCacheKey,
  createRoutePreviewRequestKey,
  fetchRoutePreview,
  isRoutePreviewCacheValid,
  RoutePreviewValidationError,
} from '../services/routePreviewService';

interface UseRoutePreviewReturn {
  preview: RoutePreview | null;
  previewOrigin: LatLng | null;
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
  origin: LatLng;
  createdAt: number;
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
  const [previewOrigin, setPreviewOrigin] =
    useState<LatLng | null>(null);
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
      let requestKey: string | null = null;
      let effectiveOrigin = origin;

      setLoading(true);
      setError(null);
      setPreview(null);

      try {
        try {
          const capturedLocation =
            await capturarLocalizacaoAtual();

          if (!capturedLocation) {
            throw new Error(
              'Localização atual indisponível.',
            );
          }

          effectiveOrigin =
            capturedLocation.coordinates;
        } catch (locationError: unknown) {
          appLogger.error(
            'Erro ao atualizar origem da estimativa:',
            locationError,
          );

          throw new RoutePreviewValidationError(
            'Não foi possível atualizar sua localização. Tente novamente ou continue sem a prévia.',
          );
        }

        if (requestId !== requestIdRef.current) {
          return false;
        }

        setPreviewOrigin(effectiveOrigin);

        const cachedPreview = cacheRef.current;

        if (
          cachedPreview?.key === cacheKey &&
          isRoutePreviewCacheValid(
            cachedPreview,
            effectiveOrigin,
          )
        ) {
          setPreview(cachedPreview.data);
          return true;
        }

        requestKey = createRoutePreviewRequestKey(
          effectiveOrigin,
          routes,
        );
        let activeRequest =
          activeRequestRef.current;

        if (activeRequest?.key !== requestKey) {
          const promise = fetchRoutePreview(
            client,
            effectiveOrigin,
            routes,
          );

          activeRequest = {
            key: requestKey,
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
          origin: effectiveOrigin,
          createdAt: Date.now(),
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
          requestKey &&
          activeRequestRef.current?.key === requestKey
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
    setPreviewOrigin(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    preview,
    previewOrigin,
    loading,
    error,
    loadPreview,
    resetPreview,
  };
}
