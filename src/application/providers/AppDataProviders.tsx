import React, {
  type PropsWithChildren,
} from 'react';

import {useAuthContext} from '../../core/auth/AuthContext';
import {getAuthUserKey} from '../../core/auth/getAuthUserKey';
import {ChamadosProvider} from '../../features/chamados/ChamadosContext';
import {FiliaisProvider} from '../../features/filiais/FiliaisContext';
import {HistoricoProvider} from '../../features/historico/HistoricoContext';
import {PontosProvider} from '../../features/pontos/PontosContext';
import {ExecucaoRotaProvider} from '../../features/execucaoRota/ExecucaoRotaContext';
import HistoricoOfflineSynchronizer from '../../features/historico/components/HistoricoOfflineSynchronizer';

/**
 * Estados de tela que não podem sobreviver à troca de identidade. A `key`
 * aplicada neste componente força uma remontagem limpa no logout/login.
 */
function SessionDataProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <FiliaisProvider>
      <PontosProvider>
        <ChamadosProvider>
          <HistoricoProvider>
            <HistoricoOfflineSynchronizer />
            {children}
          </HistoricoProvider>
        </ChamadosProvider>
      </PontosProvider>
    </FiliaisProvider>
  );
}

export default function AppDataProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  const {user} = useAuthContext();
  const sessionKey =
    getAuthUserKey(user) ?? 'anonymous';

  return (
    <ExecucaoRotaProvider>
      <SessionDataProviders key={sessionKey}>
        {children}
      </SessionDataProviders>
    </ExecucaoRotaProvider>
  );
}
