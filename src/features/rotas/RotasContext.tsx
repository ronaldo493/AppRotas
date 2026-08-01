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

interface RotasContextValue {
  rotas: Filial[];
  setRotas: Dispatch<SetStateAction<Filial[]>>;
  solicitacaoTracadoId: number;
  solicitarTracado: () => void;
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
  const [solicitacaoTracadoId, setSolicitacaoTracadoId] = useState(0);
  const sequenciaRef = useRef(0);

  const solicitarTracado = useCallback((): void => {
    sequenciaRef.current += 1;
    setSolicitacaoTracadoId(sequenciaRef.current);
  }, []);

  const value = useMemo(
    () => ({
      rotas,
      setRotas,
      solicitacaoTracadoId,
      solicitarTracado,
    }),
    [rotas, solicitacaoTracadoId, solicitarTracado],
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
