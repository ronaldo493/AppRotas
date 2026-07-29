import {
  useCallback,
  useMemo,
} from 'react';

import {useAuthContext} from '../../../core/auth/AuthContext';
import {
  adicionarHistoricoPendente as adicionarNaFila,
  sincronizarHistoricosPendentes as sincronizarFila,
  type HistoricoOfflineUser,
} from '../services/historicoRotaPendente';
import type {Filial} from '../../filiais/models/Filial';
import type {TipoHistorico} from '../models/Historico';
import type {
  EnviarHistoricoRota,
} from '../useCases/registrarHistoricoRota';

/**
 * Vincula as operações da fila offline ao usuário da sessão atual, evitando
 * que telas e casos de uso precisem manipular chaves de armazenamento.
 */
export default function useHistoricoOffline() {
  const {user} = useAuthContext();

  const offlineUser =
    useMemo<HistoricoOfflineUser | null>(
      () => user
        ? {
            id: user.id,
            documentId: user.documentId,
            username: user.username,
          }
        : null,
      [
        user?.documentId,
        user?.id,
        user?.username,
      ],
    );

  const sincronizarHistoricosPendentes =
    useCallback((
      enviar: EnviarHistoricoRota,
    ): Promise<number> => {
      if (!offlineUser) {
        return Promise.resolve(0);
      }

      return sincronizarFila(
        offlineUser,
        enviar,
      );
    }, [offlineUser]);

  const adicionarHistoricoPendente =
    useCallback((
      routes: Filial[],
      datahora: string,
      cidadeOrigem: string | null,
      tipoHistorico: TipoHistorico,
    ): Promise<void> => {
      if (!offlineUser) {
        return Promise.reject(
          new Error(
            'Usuário não identificado para salvar o histórico offline.',
          ),
        );
      }

      return adicionarNaFila(
        offlineUser,
        routes,
        datahora,
        cidadeOrigem,
        tipoHistorico,
      );
    }, [offlineUser]);

  return {
    adicionarHistoricoPendente,
    sincronizarHistoricosPendentes,
  };
}
