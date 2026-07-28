import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {Filial} from './models/Filial';

interface FiliaisContextValue {
  filiais: Filial[];
  setFiliais: Dispatch<
    SetStateAction<Filial[]>
  >;
}

const FiliaisContext = createContext<
  FiliaisContextValue | undefined
>(undefined);

export function FiliaisProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [filiais, setFiliais] =
    useState<Filial[]>([]);
  const value = useMemo(
    () => ({filiais, setFiliais}),
    [filiais],
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
