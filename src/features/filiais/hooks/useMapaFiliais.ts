import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type MapView from 'react-native-maps';
import type {Region} from 'react-native-maps';

import {useMapLocation} from '../../../core/location/useLocation';
import {
  areClusterRegionsClose,
  areRegionsClose,
} from '../../../shared/maps/clustering';
import useFiliais from './useFiliais';
import {
  DEFAULT_REGION,
  getRegion,
  normalizeText,
  parseLojas,
  type FilialMapa,
  type LojaMapa,
} from '../utils/mapaFilialUtils';

interface Feedback {
  message: string;
  icon: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function useMapaFiliais() {
  const mapRef = useRef<MapView | null>(null);
  const initializedRef = useRef(false);
  const initialRegionRef = useRef<Region | null>(null);
  const lastFocusedRegionRef = useRef<Region | null>(null);

  const [search, setSearch] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [visibleRegion, setVisibleRegion] =
    useState<Region | null>(null);
  const deferredSearch = useDeferredValue(search);

  const {
    filiais,
    loading: loadingFiliais,
    error: filiaisError,
    getFiliais,
  } = useFiliais();

  const {
    currentLocation,
    mapRegion,
    loading: loadingLocation,
  } = useMapLocation();

  const lojas = useMemo(
    () => parseLojas(filiais as FilialMapa[]),
    [filiais],
  );

  const lojasFiltradas = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch);

    if (!normalizedSearch) {
      return lojas;
    }

    return lojas.filter(loja =>
      loja.searchText.includes(normalizedSearch),
    );
  }, [deferredSearch, lojas]);

  const calculatedInitialRegion = useMemo(() => {
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

  /*
   * O componente nativo considera initialRegion apenas na montagem.
   * Manter a primeira referência também evita uma animação de câmera
   * redundante quando a localização já estava disponível.
   */
  if (!initialRegionRef.current) {
    initialRegionRef.current = calculatedInitialRegion;
  }

  const initialRegion = initialRegionRef.current;

  const focusRegion = useCallback((region: Region): void => {
    lastFocusedRegionRef.current = region;
    mapRef.current?.animateToRegion(region, 400);
  }, []);

  const focusLoja = useCallback(
    (loja: LojaMapa): void => {
      focusRegion(getRegion(loja.coordinate));
    },
    [focusRegion],
  );

  const handleMapReady = useCallback((): void => {
    setMapReady(true);
    setVisibleRegion(current => current ?? initialRegionRef.current);
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region): void => {
      /*
       * O mapa nativo pode devolver pequenas variações mesmo após parar.
       * Ignorá-las mantém os clusters estáveis e evita recálculos visuais.
       */
      setVisibleRegion(current =>
        areClusterRegionsClose(current, region)
          ? current
          : region,
      );
    },
    [],
  );

  /*
   * Centraliza apenas quando a localização chegou depois da
   * montagem. Se ela já definiu initialRegion, não há animação.
   */
  useEffect(() => {
    if (!mapReady || !mapRegion) return;

    initializedRef.current = true;

    if (
      areRegionsClose(initialRegion, mapRegion) &&
      !lastFocusedRegionRef.current
    ) {
      lastFocusedRegionRef.current = mapRegion;
      return;
    }

    if (areRegionsClose(lastFocusedRegionRef.current, mapRegion)) {
      return;
    }

    focusRegion(mapRegion);
  }, [focusRegion, initialRegion, mapReady, mapRegion]);

  /*
   * Sem localização, usa Piracicaba ou a primeira loja válida.
   */
  useEffect(() => {
    if (
      initializedRef.current ||
      !mapReady ||
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
    const lojaRegion = getRegion(lojaInicial.coordinate);

    initializedRef.current = true;

    if (areRegionsClose(initialRegion, lojaRegion)) {
      lastFocusedRegionRef.current = lojaRegion;
      return;
    }

    focusRegion(lojaRegion);
  }, [
    focusRegion,
    initialRegion,
    loadingFiliais,
    loadingLocation,
    lojas,
    mapReady,
    mapRegion,
  ]);

  useEffect(() => {
    if (
      !mapReady ||
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
    mapReady,
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
        message: 'Não foi possível carregar as lojas.',
        actionLabel: 'Tentar novamente',
        onAction: retryFiliais,
      };
    }

    if (noResults) {
      return {
        icon: 'map-marker-off',
        message: 'Nenhuma loja encontrada para essa pesquisa.',
      };
    }

    return null;
  }, [filiaisError, noResults, retryFiliais]);

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
    mapReady,
    visibleRegion: visibleRegion ?? initialRegion,
    onMapReady: handleMapReady,
    onRegionChangeComplete: handleRegionChangeComplete,

    loading: loadingFiliais,
    feedback,
  };
}
