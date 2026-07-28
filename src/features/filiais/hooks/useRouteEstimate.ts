import axios from 'axios';
import {useCallback, useRef, useState} from 'react';
import type { LatLng } from 'react-native-maps';

import useStrapiClient from '../../../core/api/strapiClient';
import type {Filial} from '../models/Filial';

export interface RouteEstimate {
  durationMinutes: number;
  durationText: string;
  distanceKm: number;
  distanceText: string;
}

interface UseRouteEstimateReturn {
  estimate: RouteEstimate | null;
  loading: boolean;
  error: string | null;

  getEstimate: (origin: LatLng, filial: Filial) => Promise<boolean>;

  clearEstimate: () => void;
}

interface LastEstimateCache {
  key: string;
  data: RouteEstimate;
  createdAt: number;
}

const CACHE_DURATION_MS = 10 * 60 * 1000;

const parseCoordinate = (value: unknown): number | null => {
  const normalizedValue = String(value ?? '')
    .trim()
    .replace(',', '.');

  if (!normalizedValue)  return null;

  const coordinate = Number(normalizedValue);

  return Number.isFinite(coordinate)
    ? coordinate
    : null;
};

const isValidCoordinate = (latitude: number | null, longitude: number | null): latitude is number => {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const getRequestErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      'Não foi possível calcular o tempo até esta filial.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível calcular o tempo até esta filial.';
};

const createEstimateKey = (origin: LatLng,  filial: Filial): string =>
  [
    origin.latitude.toFixed(3),
    origin.longitude.toFixed(3),
    filial.codigofilial,
  ].join(':');

export default function useRouteEstimate(): UseRouteEstimateReturn {
  const conexao = useStrapiClient();

  const [estimate, setEstimate] = useState<RouteEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Identifica a consulta mais recente.
   * Respostas antigas são ignoradas.
   */
  const requestIdRef = useRef(0);

  /*
   * Evita duas consultas iguais acontecendo
   * ao mesmo tempo.
   */
  const activeRequestKeyRef = useRef<string | null>(null);

  /*
   * Guarda somente a última estimativa durante
   * alguns minutos.
   */
  const lastEstimateRef = useRef<LastEstimateCache | null>(null);

  const getEstimate = useCallback(
    async (origin: LatLng, filial: Filial): Promise<boolean> => {
      const latitude = parseCoordinate(
filial.latitude,
      );

      const longitude = parseCoordinate(
        filial.longitude,
      );

      if (!isValidCoordinate(latitude, longitude) || longitude === null) {
        setEstimate(null);
        setError('A filial não possui coordenadas válidas.');

        return false;
      }

      const requestKey = createEstimateKey(origin, filial);

      /*
       * A mesma consulta já está sendo realizada.
       */
      if ( activeRequestKeyRef.current === requestKey) return false;

      /*
       * Reaproveita somente a última estimativa,
       * desde que ainda esteja dentro do prazo.
       */
      const cachedEstimate = lastEstimateRef.current;

      const cacheIsValid = cachedEstimate?.key === requestKey && Date.now() - cachedEstimate.createdAt <  CACHE_DURATION_MS;

      if (cacheIsValid) {
        setEstimate(cachedEstimate.data);
        setError(null);
        setLoading(false);

        return true;
      }

      const currentRequestId = ++requestIdRef.current;

      activeRequestKeyRef.current = requestKey;

      setLoading(true);
      setError(null);
      setEstimate(null);

      try {
        const response = await conexao.post<RouteEstimate>('/estimativa-rota/calcular',
          {
            origin: {
              latitude:
                origin.latitude,
              longitude:
                origin.longitude,
            },
            destination: {
              latitude,
              longitude,
            },
          },
        );

        /*
         * O usuário pesquisou outra filial antes
         * desta resposta chegar.
         */
        if (currentRequestId !== requestIdRef.current) return false;

        lastEstimateRef.current = {
          key: requestKey,
          data: response.data,
          createdAt: Date.now(),
        };

        setEstimate(response.data);
        setError(null);

        return true;
      } catch (requestError: unknown) {
        if (currentRequestId !==  requestIdRef.current ) {
          return false;
        }

        console.error('Erro ao calcular estimativa:', requestError);

        setEstimate(null);
        setError(getRequestErrorMessage(requestError),
        );

        return false;
      } finally {
        if (activeRequestKeyRef.current === requestKey) {
          activeRequestKeyRef.current = null;
        }

        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [conexao],
  );

  const clearEstimate =
    useCallback((): void => {
      /*
       * Invalida qualquer resposta pendente.
       */
      requestIdRef.current += 1;
      activeRequestKeyRef.current = null;

      /*
       * Limpa somente o que está sendo exibido.
       * A última estimativa permanece no cache
       * temporário para possível reutilização.
       */
      setEstimate(null);
      setError(null);
      setLoading(false);
    }, []);

  return {
    estimate,
    loading,
    error,
    getEstimate,
    clearEstimate,
  };
}
