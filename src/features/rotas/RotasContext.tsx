import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import useResetOnUserChange from '../../shared/hooks/useResetOnUserChange';
import type {Filial} from '../filiais/models/Filial';

interface RotasContextValue {
  rotas: Filial[];
  setRotas: Dispatch<SetStateAction<Filial[]>>;
}

const RotasContext = createContext<RotasContextValue | undefined>(undefined);

/**
 * Compartilha a rota em todas as telas e elimina o estado ao trocar de usuário.
 */
export function RotasProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [rotas, setRotas] = useState<Filial[]>([]);
  const limparRotas = useCallback((): void => setRotas([]), []);

  useResetOnUserChange(limparRotas);

  const value = useMemo(
    () => ({rotas, setRotas}),
    [rotas],
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
    throw new Error(
      'useRotasContext deve ser usado dentro de RotasProvider.',
    );
  }

  return context;
}
