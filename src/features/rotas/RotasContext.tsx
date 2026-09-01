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

import type {Filial} from '../filiais/models/Filial';
import type {NavegadorRota} from '../execucaoRota/models/ExecucaoRota';

export interface SolicitacaoTracadoRota {
  id: number;
  modo: 'previa' | 'direto';
  navegador?: NavegadorRota;
  onFeedback?: (texto: string, textoFalado?: string) => void;
}

export interface OpcoesSolicitacaoTracadoRota {
  modo?: SolicitacaoTracadoRota['modo'];
  navegador?: NavegadorRota;
  onFeedback?: SolicitacaoTracadoRota['onFeedback'];
}

interface RotasContextValue {
  rotas: Filial[];
  setRotas: Dispatch<SetStateAction<Filial[]>>;
  solicitacaoTracado: SolicitacaoTracadoRota | null;
  solicitarTracado: (opcoes?: OpcoesSolicitacaoTracadoRota) => void;
}

const RotasContext = createContext<RotasContextValue | undefined>(undefined);

/**
 * Compartilha a lista em construção com integrações autorizadas. A execução e
 * a prévia continuam pertencendo à tela de rotas, preservando um único fluxo.
 */
export function RotasProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [rotas, setRotas] = useState<Filial[]>([]);
  const [solicitacaoTracado, setSolicitacaoTracado] =
    useState<SolicitacaoTracadoRota | null>(null);
  const sequenciaRef = useRef(0);

  const solicitarTracado = useCallback((
    opcoes: OpcoesSolicitacaoTracadoRota = {},
  ): void => {
    sequenciaRef.current += 1;
    setSolicitacaoTracado({
      id: sequenciaRef.current,
      modo: opcoes.modo ?? 'previa',
      ...(opcoes.navegador ? {navegador: opcoes.navegador} : {}),
      ...(opcoes.onFeedback ? {onFeedback: opcoes.onFeedback} : {}),
    });
  }, []);

  const value = useMemo(
    () => ({
      rotas,
      setRotas,
      solicitacaoTracado,
      solicitarTracado,
    }),
    [rotas, solicitacaoTracado, solicitarTracado],
  );

  return (
    <RotasContext.Provider value={value}>
      {children}
    </RotasContext.Provider>
  );
}

export function useRotasContext(): RotasContextValue {
  const context = useContext(RotasContext);

  if (!context) {
    throw new Error('useRotasContext deve ser usado dentro de RotasProvider.');
  }

  return context;
}
