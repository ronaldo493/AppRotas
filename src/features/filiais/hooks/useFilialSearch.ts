import debounce from 'lodash.debounce';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { LatLng } from 'react-native-maps';

import useFiliais from './useFiliais';
import useRouteEstimate from './useRouteEstimate';
import type {Filial} from '../models/Filial';

interface UseSearchFilialProps {
  currentLocation: LatLng | null;
  onAddRoute: (filial: Filial) => void;
  onResultChange?: (hasSearch: boolean) => void;
}

const SEARCH_DEBOUNCE_MS = 400;
const ESTIMATE_DEBOUNCE_MS = 500;

export default function useSearchFilial({
  currentLocation,
  onAddRoute,
  onResultChange,
}: UseSearchFilialProps) {
    
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  const [searchFinished, setSearchFinished] = useState(false);

  const {filiais = [], error: filiaisError, loading: loadingFiliais,} = useFiliais();

  const {
    estimate,
    loading: loadingEstimate,
    error: estimateError,
    getEstimate,
    clearEstimate,
  } = useRouteEstimate();

  const debouncedSearch = useMemo(
    () =>
      debounce((text: string): void => {
        const value = text.trim();
        const codigoFilial = Number(value);

        if (!value || !Number.isFinite(codigoFilial)) {
          setSelectedFilial(null);
          setSearchFinished(Boolean(value));
          return;
        }

        const filialEncontrada = filiais.find(filial => Number(filial.codigofilial) === codigoFilial);

        setSelectedFilial(filialEncontrada ?? null);

        setSearchFinished(true);
      }, SEARCH_DEBOUNCE_MS),
    [filiais],
  );

  useEffect(() => {
    debouncedSearch.cancel();

    const value = searchTerm.trim();

    if (!value || loadingFiliais || filiaisError) {
      setSearchFinished(false);
      return;
    }

    debouncedSearch(value);

    return () => {
      debouncedSearch.cancel();
    };
  }, [
    debouncedSearch,
    filiaisError,
    loadingFiliais,
    searchTerm,
  ]);

  /*
   * Depois que a filial for encontrada,
   * aguarda mais 500 ms antes de consultar
   * o Strapi/Google.
   */
  useEffect(() => {
    if (!selectedFilial || !currentLocation) {
      clearEstimate();
      return;
    }

    const timeoutId = setTimeout(() => {
      void getEstimate(currentLocation, selectedFilial);
    }, ESTIMATE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    clearEstimate,
    currentLocation,
    getEstimate,
    selectedFilial,
  ]);

  useEffect(() => {
    onResultChange?.(
      searchTerm.trim().length > 0,
    );
  }, [onResultChange, searchTerm]);

  const handleSearch = useCallback(
    (text: string): void => {
      setSearchTerm(text);
      setSelectedFilial(null);
      setSearchFinished(false);

      clearEstimate();
    },
    [clearEstimate],
  );

  const clearSearch = useCallback((): void => {
    debouncedSearch.cancel();

    setSearchTerm('');
    setSelectedFilial(null);
    setSearchFinished(false);

    clearEstimate();
  }, [
    clearEstimate,
    debouncedSearch,
  ]);

  const addSelectedFilial =
    useCallback((): void => {
      if (!selectedFilial) return;

      onAddRoute(selectedFilial);
      clearSearch();
    }, [
      clearSearch,
      onAddRoute,
      selectedFilial,
    ]);

  const filialNotFound =
    searchFinished &&
    searchTerm.trim().length > 0 &&
    selectedFilial === null &&
    !loadingFiliais &&
    !filiaisError;

  return {
    searchTerm,
    handleSearch,
    clearSearch,

    selectedFilial,
    filialNotFound,
    addSelectedFilial,

    loadingFiliais,
    filiaisError,

    estimate,
    loadingEstimate,
    estimateError,
  };
}
