import React, {
  type PropsWithChildren,
} from 'react';

import {ChamadosProvider} from '../../features/chamados/ChamadosContext';
import {FiliaisProvider} from '../../features/filiais/FiliaisContext';
import {HistoricoProvider} from '../../features/historico/HistoricoContext';
import {PontosProvider} from '../../features/pontos/PontosContext';
import {ExecucaoRotaProvider} from '../../features/execucaoRota/ExecucaoRotaContext';
import HistoricoOfflineSynchronizer from '../../features/historico/components/HistoricoOfflineSynchronizer';

export default function AppDataProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <ExecucaoRotaProvider>
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
    </ExecucaoRotaProvider>
  );
}
