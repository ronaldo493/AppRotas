import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { Filial } from '../type/Filial';
import { HistoricoVisita } from '../type/Historico';

interface StrapiContextData {
  filiais: Filial[];
  setFiliais: Dispatch<SetStateAction<Filial[]>>;

  pontos: any[];
  setPontos: Dispatch<SetStateAction<any[]>>;

  chamados: any[];
  setChamados: Dispatch<SetStateAction<any[]>>;

  historicosRotas: HistoricoVisita[];
  setHistoricosRotas: Dispatch<SetStateAction<HistoricoVisita[]>>;
}

const StrapiContext = createContext<StrapiContextData | undefined>(
  undefined,
);

export function StrapiProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [pontos, setPontos] = useState<any[]>([]);
  const [chamados, setChamados] = useState<any[]>([]);
  const [historicosRotas, setHistoricosRotas] = useState<HistoricoVisita[]>([]);

  const contextValue = useMemo(
    () => ({
      filiais,
      setFiliais,
      pontos,
      setPontos,
      chamados,
      setChamados,
      historicosRotas,
      setHistoricosRotas,
    }),
    [filiais, pontos, chamados, historicosRotas],
  );

  return (
    <StrapiContext.Provider value={contextValue}>
      {children}
    </StrapiContext.Provider>
  );
}

export function useStrapiContext(): StrapiContextData {
  const context = useContext(StrapiContext);

  if (!context) {
    throw new Error(
      'useStrapiContext deve ser usado dentro do StrapiProvider.',
    );
  }

  return context;
}