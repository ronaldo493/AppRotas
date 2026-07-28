import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {Chamado} from './models/Chamado';

interface ChamadosContextValue {
  chamados: Chamado[];
  setChamados: Dispatch<
    SetStateAction<Chamado[]>
  >;
}

const ChamadosContext = createContext<
  ChamadosContextValue | undefined
>(undefined);

export function ChamadosProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [chamados, setChamados] =
    useState<Chamado[]>([]);
  const value = useMemo(
    () => ({chamados, setChamados}),
    [chamados],
  );

  return (
    <ChamadosContext.Provider value={value}>
      {children}
    </ChamadosContext.Provider>
  );
}

export function useChamadosContext(): ChamadosContextValue {
  const context = useContext(
    ChamadosContext,
  );

  if (!context) {
    throw new Error(
      'useChamadosContext deve ser usado dentro de ChamadosProvider.',
    );
  }

  return context;
}
