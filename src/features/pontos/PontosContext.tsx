import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {PontoInteresse} from './models/Ponto';

interface PontosContextValue {
  pontos: PontoInteresse[];
  setPontos: Dispatch<
    SetStateAction<PontoInteresse[]>
  >;
  solicitacaoNavegacao: SolicitacaoNavegacaoPonto | null;
  solicitarNavegacao: (
    ponto: PontoInteresse,
    iniciarFluxo: boolean,
  ) => void;
  consumirSolicitacaoNavegacao: (id: number) => void;
}

export interface SolicitacaoNavegacaoPonto {
  id: number;
  ponto: PontoInteresse;
  iniciarFluxo: boolean;
}

const PontosContext = createContext<
  PontosContextValue | undefined
>(undefined);

export function PontosProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [pontos, setPontos] =
    useState<PontoInteresse[]>([]);
  const [solicitacaoNavegacao, setSolicitacaoNavegacao] =
    useState<SolicitacaoNavegacaoPonto | null>(null);
  const sequenciaRef = useRef(0);

  const solicitarNavegacao = useCallback(
    (ponto: PontoInteresse, iniciarFluxo: boolean): void => {
      sequenciaRef.current += 1;
      setSolicitacaoNavegacao({
        id: sequenciaRef.current,
        ponto,
        iniciarFluxo,
      });
    },
    [],
  );

  const consumirSolicitacaoNavegacao = useCallback((id: number): void => {
    setSolicitacaoNavegacao(current =>
      current?.id === id ? null : current,
    );
  }, []);

  const value = useMemo(
    () => ({
      pontos,
      setPontos,
      solicitacaoNavegacao,
      solicitarNavegacao,
      consumirSolicitacaoNavegacao,
    }),
    [
      consumirSolicitacaoNavegacao,
      pontos,
      solicitacaoNavegacao,
      solicitarNavegacao,
    ],
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
