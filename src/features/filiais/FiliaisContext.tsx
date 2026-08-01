import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {Filial} from './models/Filial';

interface FiliaisContextValue {
  filiais: Filial[];
  setFiliais: Dispatch<
    SetStateAction<Filial[]>
  >;
  solicitacaoPesquisaMapa: SolicitacaoPesquisaMapa | null;
  solicitarPesquisaMapa: (termo: string) => void;
  consumirPesquisaMapa: (id: number) => void;
}

export interface SolicitacaoPesquisaMapa {
  id: number;
  termo: string;
}

const FiliaisContext = createContext<
  FiliaisContextValue | undefined
>(undefined);

export function FiliaisProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [filiais, setFiliais] =
    useState<Filial[]>([]);
  const [solicitacaoPesquisaMapa, setSolicitacaoPesquisaMapa] =
    useState<SolicitacaoPesquisaMapa | null>(null);
  const sequenciaPesquisaRef = useRef(0);

  const solicitarPesquisaMapa = useCallback((termo: string): void => {
    sequenciaPesquisaRef.current += 1;
    setSolicitacaoPesquisaMapa({
      id: sequenciaPesquisaRef.current,
      termo,
    });
  }, []);

  const consumirPesquisaMapa = useCallback((id: number): void => {
    setSolicitacaoPesquisaMapa(current => current?.id === id ? null : current);
  }, []);

  const value = useMemo(
    () => ({
      filiais,
      setFiliais,
      solicitacaoPesquisaMapa,
      solicitarPesquisaMapa,
      consumirPesquisaMapa,
    }),
    [
      consumirPesquisaMapa,
      filiais,
      solicitacaoPesquisaMapa,
      solicitarPesquisaMapa,
    ],
  );

  return (
    <FiliaisContext.Provider value={value}>
      {children}
    </FiliaisContext.Provider>
  );
}

export function useFiliaisContext(): FiliaisContextValue {
  const context = useContext(FiliaisContext);

  if (!context) {
    throw new Error(
      'useFiliaisContext deve ser usado dentro de FiliaisProvider.',
    );
  }

  return context;
}
