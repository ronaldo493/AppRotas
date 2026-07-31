import debounce from 'lodash.debounce';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useFiliais from './useFiliais';
import type {Filial} from '../models/Filial';

interface UseSearchFilialProps {
  onAddRoute: (filial: Filial) => void;
  onResultChange?: (hasSearch: boolean) => void;
}

const SEARCH_DEBOUNCE_MS = 400;

export default function useSearchFilial({
  onAddRoute,
  onResultChange,
}: UseSearchFilialProps) {
    
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilial, setSelectedFilial] = useState<Filial | null>(null);
  const [searchFinished, setSearchFinished] = useState(false);

  const {filiais = [], error: filiaisError, loading: loadingFiliais,} = useFiliais();

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

    },
    [],
  );

  const clearSearch = useCallback((): void => {
    debouncedSearch.cancel();

    setSearchTerm('');
    setSelectedFilial(null);
    setSearchFinished(false);

  }, [debouncedSearch]);

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

  };
}
