import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {PontoInteresse} from './models/Ponto';

interface PontosContextValue {
  pontos: PontoInteresse[];
  setPontos: Dispatch<
    SetStateAction<PontoInteresse[]>
  >;
}

const PontosContext = createContext<
  PontosContextValue | undefined
>(undefined);

export function PontosProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [pontos, setPontos] =
    useState<PontoInteresse[]>([]);
  const value = useMemo(
    () => ({pontos, setPontos}),
    [pontos],
  );

  return (
    <PontosContext.Provider value={value}>
      {children}
    </PontosContext.Provider>
  );
}

export function usePontosContext(): PontosContextValue {
  const context = useContext(PontosContext);

  if (!context) {
    throw new Error(
      'usePontosContext deve ser usado dentro de PontosProvider.',
    );
  }

  return context;
}
