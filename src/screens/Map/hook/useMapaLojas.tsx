import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';

import useFiliais from '../../../hooks/useFiliais';
import useLocation from '../../../hooks/useLocation';
import {
  DEFAULT_REGION,
  getRegion,
  normalizeText,
  parseLojas,
  type FilialMapa,
  type LojaMapa,
} from '../utils/mapaLojaUtils';

interface Feedback {
  message: string;
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function useMapaLojas() {
  const mapRef = useRef<MapView | null>(null);
  const initializedRef = useRef(false);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const {
    filiais,
    loading: loadingFiliais,
    error: filiaisError,
    getFiliais,
  } = useFiliais();

  /*
   * O mapa apenas consome a localização que já foi
   * solicitada pela Home.
   */
  const {
    currentLocation,
    mapRegion,
    loading: loadingLocation,
  } = useLocation();

  const lojas = useMemo(
    () => parseLojas(filiais as FilialMapa[]),
    [filiais],
  );

  const lojasFiltradas = useMemo(() => {
    const normalizedSearch =
      normalizeText(deferredSearch);

    if (!normalizedSearch) {
      return lojas;
    }

    return lojas.filter(loja =>
      loja.searchText.includes(normalizedSearch),
    );
  }, [deferredSearch, lojas]);

  const focusRegion = useCallback(
    (region: Region): void => {
      mapRef.current?.animateToRegion(region, 400);
    },
    [],
  );

  const focusLoja = useCallback(
    (loja: LojaMapa): void => {
      focusRegion(getRegion(loja.coordinate));
    },
    [focusRegion],
  );

  /*
   * Caso a Home tenha conseguido a localização,
   * centraliza o mapa no usuário.
   */
  useEffect(() => {
    if (!mapRegion) {
      return;
    }

    initializedRef.current = true;
    focusRegion(mapRegion);
  }, [focusRegion, mapRegion]);

  /*
   * Se a localização não existir, centraliza em
   * Piracicaba ou na primeira loja válida.
   */
  useEffect(() => {
    if (
      initializedRef.current ||
      loadingFiliais ||
      loadingLocation ||
      mapRegion ||
      lojas.length === 0
    ) {
      return;
    }

    const lojaInicial =
      lojas.find(loja =>
        loja.searchText.includes('piracicaba'),
      ) ?? lojas[0];

    initializedRef.current = true;
    focusLoja(lojaInicial);
  }, [
    focusLoja,
    loadingFiliais,
    loadingLocation,
    lojas,
    mapRegion,
  ]);

  useEffect(() => {
    if (
      !normalizeText(deferredSearch) ||
      lojasFiltradas.length === 0
    ) {
      return;
    }

    focusLoja(lojasFiltradas[0]);
  }, [
    deferredSearch,
    focusLoja,
    lojasFiltradas,
  ]);

  const retryFiliais = useCallback((): void => {
    void getFiliais();
  }, [getFiliais]);

  const hasSearch = search.trim().length > 0;

  const noResults =
    !loadingFiliais &&
    !filiaisError &&
    hasSearch &&
    lojasFiltradas.length === 0;

  const feedback = useMemo<Feedback | null>(() => {
    if (filiaisError) {
      return {
        icon: 'alert-circle-outline',
        message:
          'Não foi possível carregar as lojas.',
        actionLabel: 'Tentar novamente',
        onAction: retryFiliais,
      };
    }

    if (noResults) {
      return {
        icon: 'map-marker-off',
        message:
          'Nenhuma loja encontrada para essa pesquisa.',
      };
    }

    return null;
  }, [
    filiaisError,
    noResults,
    retryFiliais,
  ]);

  const initialRegion = useMemo(() => {
    if (mapRegion) {
      return mapRegion;
    }

    const lojaInicial =
      lojas.find(loja =>
        loja.searchText.includes('piracicaba'),
      ) ?? lojas[0];

    return lojaInicial
      ? getRegion(lojaInicial.coordinate)
      : DEFAULT_REGION;
  }, [lojas, mapRegion]);

  const clearSearch = useCallback((): void => {
    setSearch('');
  }, []);

  return {
    mapRef,
    search,
    setSearch,
    clearSearch,

    lojas: lojasFiltradas,
    initialRegion,
    currentLocation,

    loading: loadingFiliais,
    feedback,
  };
}