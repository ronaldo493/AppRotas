import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useCallback,
  useMemo,
  useState,
} from 'react';

import useResetOnUserChange from '../../shared/hooks/useResetOnUserChange';
import type {PontoInteresse} from './models/Ponto';

interface PontosContextValue {
  pontos: PontoInteresse[];
  setPontos: Dispatch<
    SetStateAction<PontoInteresse[]>
  >;
  pontoDestacado: PontoInteresse | null;
  setPontoDestacado: Dispatch<SetStateAction<PontoInteresse | null>>;
}

const PontosContext = createContext<
  PontosContextValue | undefined
>(undefined);

export function PontosProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [pontos, setPontos] =
    useState<PontoInteresse[]>([]);
  const [pontoDestacado, setPontoDestacado] =
    useState<PontoInteresse | null>(null);
  const limparPontos = useCallback((): void => {
    setPontos([]);
    setPontoDestacado(null);
  }, []);

  useResetOnUserChange(limparPontos);

  const value = useMemo(
    () => ({
      pontos,
      setPontos,
      pontoDestacado,
      setPontoDestacado,
    }),
    [pontoDestacado, pontos],
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
