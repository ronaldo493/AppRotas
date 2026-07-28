import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { Filial } from '../type/Filial';
import type { HistoricoVisita } from '../type/Historico';
import type {PontoInteresse} from '../type/Ponto';

interface FiliaisContextData {
  filiais: Filial[];
  setFiliais: Dispatch<SetStateAction<Filial[]>>;
}

interface PontosContextData {
  pontos: PontoInteresse[];
  setPontos: Dispatch<SetStateAction<PontoInteresse[]>>;
}

interface ChamadosContextData {
  // O contrato dos chamados ainda é definido pelo módulo legado.
  chamados: any[];
  setChamados: Dispatch<SetStateAction<any[]>>;
}

interface HistoricosContextData {
  historicosRotas: HistoricoVisita[];
  setHistoricosRotas: Dispatch<SetStateAction<HistoricoVisita[]>>;
}

const FiliaisContext =
  createContext<FiliaisContextData | undefined>(undefined);
const PontosContext =
  createContext<PontosContextData | undefined>(undefined);
const ChamadosContext =
  createContext<ChamadosContextData | undefined>(undefined);
const HistoricosContext =
  createContext<HistoricosContextData | undefined>(undefined);

function FiliaisProvider({children}: PropsWithChildren): React.JSX.Element {
  const [filiais, setFiliais] = useState<Filial[]>([]);

  const value = useMemo(
    () => ({
      filiais,
      setFiliais,
    }),
    [filiais],
  );

  return (
    <FiliaisContext.Provider value={value}>
      {children}
    </FiliaisContext.Provider>
  );
}

function PontosProvider({children}: PropsWithChildren): React.JSX.Element {
  const [pontos, setPontos] = useState<PontoInteresse[]>([]);

  const value = useMemo(
    () => ({
      pontos,
      setPontos,
    }),
    [pontos],
  );

  return (
    <PontosContext.Provider value={value}>
      {children}
    </PontosContext.Provider>
  );
}

function ChamadosProvider({children}: PropsWithChildren): React.JSX.Element {
  const [chamados, setChamados] = useState<any[]>([]);

  const value = useMemo(
    () => ({
      chamados,
      setChamados,
    }),
    [chamados],
  );

  return (
    <ChamadosContext.Provider value={value}>
      {children}
    </ChamadosContext.Provider>
  );
}

function HistoricosProvider({children}: PropsWithChildren): React.JSX.Element {
  const [historicosRotas, setHistoricosRotas] =
    useState<HistoricoVisita[]>([]);

  const value = useMemo(
    () => ({
      historicosRotas,
      setHistoricosRotas,
    }),
    [historicosRotas],
  );

  return (
    <HistoricosContext.Provider value={value}>
      {children}
    </HistoricosContext.Provider>
  );
}

export function StrapiProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <FiliaisProvider>
      <PontosProvider>
        <ChamadosProvider>
          <HistoricosProvider>
            {children}
          </HistoricosProvider>
        </ChamadosProvider>
      </PontosProvider>
    </FiliaisProvider>
  );
}

export function useFiliaisContext(): FiliaisContextData {
  const context = useContext(FiliaisContext);

  if (!context) {
    throw new Error(
      'useFiliaisContext deve ser usado dentro do StrapiProvider.',
    );
  }

  return context;
}

export function usePontosContext(): PontosContextData {
  const context = useContext(PontosContext);

  if (!context) {
    throw new Error(
      'usePontosContext deve ser usado dentro do StrapiProvider.',
    );
  }

  return context;
}

export function useChamadosContext(): ChamadosContextData {
  const context = useContext(ChamadosContext);

  if (!context) {
    throw new Error(
      'useChamadosContext deve ser usado dentro do StrapiProvider.',
    );
  }

  return context;
}

export function useHistoricosContext(): HistoricosContextData {
  const context = useContext(HistoricosContext);

  if (!context) {
    throw new Error(
      'useHistoricosContext deve ser usado dentro do StrapiProvider.',
    );
  }

  return context;
}
