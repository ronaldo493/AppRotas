import axios from 'axios';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import type {LatLng} from 'react-native-maps';

import useStrapiClient from '../../../core/api/strapiClient';
import type {CapturedLocation} from '../../../core/location/models/LocationSnapshot';
import {obterLocalizacaoRecente} from '../../../core/location/services/locationSnapshotService';
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
import {
  ROUTE_PREVIEW_LOCATION_MAX_ACCURACY_METERS,
  ROUTE_PREVIEW_LOCATION_MAX_AGE_MS,
} from '../useCases/validarOrigemPreviaRota';

interface UseRoutePreviewReturn {
  preview: RoutePreview | null;
  previewOrigin: LatLng | null;
  loading: boolean;
  error: string | null;
  loadPreview: (
    origin: LatLng,
    routes: readonly Filial[],
    originSnapshot?: CapturedLocation | null,
  ) => Promise<RoutePreview | null>;
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
      originSnapshot?: CapturedLocation | null,
    ): Promise<RoutePreview | null> => {
      const requestId = ++requestIdRef.current;
      const cacheKey =
        createRoutePreviewCacheKey(routes);
      let requestKey: string | null = null;
      let effectiveOrigin = origin;

      setLoading(true);
      setError(null);
      setPreview(null);

      try {
        const locationStartedAt = Date.now();
        try {
          const capturedLocation =
            await obterLocalizacaoRecente(
              originSnapshot,
              {
                maxAgeMs:
                  ROUTE_PREVIEW_LOCATION_MAX_AGE_MS,
                maxAccuracyMeters:
                  ROUTE_PREVIEW_LOCATION_MAX_ACCURACY_METERS,
              },
            );

          if (!capturedLocation) {
            throw new Error(
              'Localização atual indisponível.',
            );
          }

          effectiveOrigin =
            capturedLocation.coordinates;
          appLogger.debug(
            '[prévia-rota] Origem resolvida em',
            `${Date.now() - locationStartedAt}ms`,
          );
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
          return null;
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
          return cachedPreview.data;
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

        const previewStartedAt = Date.now();
        const result = await activeRequest.promise;
        appLogger.debug(
          '[prévia-rota] Estimativa recebida em',
          `${Date.now() - previewStartedAt}ms`,
        );

        if (requestId !== requestIdRef.current) {
          return null;
        }

        cacheRef.current = {
          key: cacheKey,
          origin: effectiveOrigin,
          createdAt: Date.now(),
          data: result,
        };
        setPreview(result);
        return result;
      } catch (requestError: unknown) {
        if (requestId !== requestIdRef.current) {
          return null;
        }

        setError(getErrorMessage(requestError));
        return null;
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
