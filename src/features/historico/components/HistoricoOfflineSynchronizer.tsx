import {useCallback, useEffect} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import {appLogger} from '../../../shared/logging/appLogger';
import useHistoricoOffline from '../hooks/useHistoricoOffline';
import useHistoricoRotas from '../hooks/useHistoricoRotas';

/**
 * Mantém compatibilidade com históricos criados por versões anteriores. Novas
 * viagens utilizam a fila SQLite do domínio de execução de rota.
 */
export default function HistoricoOfflineSynchronizer(): null {
  const {postHistoricoRota} = useHistoricoRotas({
    loadOnMount: false,
  });
  const {sincronizarHistoricosPendentes} =
    useHistoricoOffline();

  const synchronize = useCallback(
    async (): Promise<void> => {
      try {
        await sincronizarHistoricosPendentes(
          postHistoricoRota,
        );
      } catch (error: unknown) {
        appLogger.warn(
          'A fila legada de histórico permanece pendente:',
          error instanceof Error
            ? error.message
            : 'erro desconhecido',
        );
      }
    },
    [
      postHistoricoRota,
      sincronizarHistoricosPendentes,
    ],
  );

  useEffect(() => {
    void synchronize();
  }, [synchronize]);

  useEffect(() => {
    const handleAppStateChange = (
      state: AppStateStatus,
    ): void => {
      if (state === 'active') {
        void synchronize();
      }
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => subscription.remove();
  }, [synchronize]);

  return null;
}
