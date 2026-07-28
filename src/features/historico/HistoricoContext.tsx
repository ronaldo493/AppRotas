import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {HistoricoVisita} from './models/Historico';

interface HistoricoContextValue {
  historicosRotas: HistoricoVisita[];
  setHistoricosRotas: Dispatch<
    SetStateAction<HistoricoVisita[]>
  >;
}

const HistoricoContext = createContext<
  HistoricoContextValue | undefined
>(undefined);

export function HistoricoProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [
    historicosRotas,
    setHistoricosRotas,
  ] = useState<HistoricoVisita[]>([]);
  const value = useMemo(
    () => ({
      historicosRotas,
      setHistoricosRotas,
    }),
    [historicosRotas],
  );

  return (
    <HistoricoContext.Provider value={value}>
      {children}
    </HistoricoContext.Provider>
  );
}

export function useHistoricoContext(): HistoricoContextValue {
  const context = useContext(
    HistoricoContext,
  );

  if (!context) {
    throw new Error(
      'useHistoricoContext deve ser usado dentro de HistoricoProvider.',
    );
  }

  return context;
}
