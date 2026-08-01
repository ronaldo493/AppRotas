import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {appLogger} from '../../../shared/logging/appLogger';

const ASSISTANT_VOICE_STORAGE_KEY =
  '@drogal:assistant-spoken-responses-enabled';

interface AssistentePreferencesContextValue {
  respostasFaladasAtivas: boolean;
  preferenciasCarregadas: boolean;
  definirRespostasFaladasAtivas: (ativas: boolean) => Promise<boolean>;
  alternarRespostasFaladas: () => Promise<boolean>;
}

const AssistentePreferencesContext = createContext<
  AssistentePreferencesContextValue | undefined
>(undefined);

/**
 * Persiste preferências do assistente que pertencem ao aparelho, mantendo-as
 * independentes da sessão e dos dados de negócio do usuário.
 */
export function AssistentePreferencesProvider({
  children,
}: PropsWithChildren): React.JSX.Element {
  const [respostasFaladasAtivas, setRespostasFaladasAtivas] = useState(true);
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);
  const respostasFaladasAtivasRef = useRef(true);

  useEffect(() => {
    const carregarPreferencias = async (): Promise<void> => {
      try {
        const valorSalvo = await AsyncStorage.getItem(
          ASSISTANT_VOICE_STORAGE_KEY,
        );

        if (valorSalvo === 'false' || valorSalvo === 'true') {
          const ativas = valorSalvo === 'true';

          respostasFaladasAtivasRef.current = ativas;
          setRespostasFaladasAtivas(ativas);
        }
      } catch (error: unknown) {
        appLogger.error(
          'Erro ao carregar preferências do assistente:',
          error,
        );
      } finally {
        setPreferenciasCarregadas(true);
      }
    };

    void carregarPreferencias();
  }, []);

  const definirRespostasFaladasAtivas = useCallback(
    async (ativas: boolean): Promise<boolean> => {
      const valorAnterior = respostasFaladasAtivasRef.current;

      respostasFaladasAtivasRef.current = ativas;
      setRespostasFaladasAtivas(ativas);

      try {
        await AsyncStorage.setItem(
          ASSISTANT_VOICE_STORAGE_KEY,
          String(ativas),
        );
        return true;
      } catch (error: unknown) {
        respostasFaladasAtivasRef.current = valorAnterior;
        setRespostasFaladasAtivas(valorAnterior);
        appLogger.error(
          'Erro ao salvar preferências do assistente:',
          error,
        );
        return false;
      }
    },
    [],
  );

  const alternarRespostasFaladas = useCallback(
    async (): Promise<boolean> => {
      return definirRespostasFaladasAtivas(
        !respostasFaladasAtivasRef.current,
      );
    },
    [definirRespostasFaladasAtivas],
  );

  const value = useMemo(
    () => ({
      respostasFaladasAtivas,
      preferenciasCarregadas,
      definirRespostasFaladasAtivas,
      alternarRespostasFaladas,
    }),
    [
      alternarRespostasFaladas,
      definirRespostasFaladasAtivas,
      preferenciasCarregadas,
      respostasFaladasAtivas,
    ],
  );

  return (
    <AssistentePreferencesContext.Provider value={value}>
      {children}
    </AssistentePreferencesContext.Provider>
  );
}

/**
 * Expõe as preferências globais de áudio do assistente.
 */
export function useAssistentePreferences(): AssistentePreferencesContextValue {
  const context = useContext(AssistentePreferencesContext);

  if (!context) {
    throw new Error(
      'useAssistentePreferences deve ser usado dentro de AssistentePreferencesProvider.',
    );
  }

  return context;
}
