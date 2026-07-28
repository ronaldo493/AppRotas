import React, {
  type PropsWithChildren,
} from 'react';

import {ChamadosProvider} from '../../features/chamados/ChamadosContext';
import {FiliaisProvider} from '../../features/filiais/FiliaisContext';
import {HistoricoProvider} from '../../features/historico/HistoricoContext';
import {PontosProvider} from '../../features/pontos/PontosContext';

export default function AppDataProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <FiliaisProvider>
      <PontosProvider>
        <ChamadosProvider>
          <HistoricoProvider>
            {children}
          </HistoricoProvider>
        </ChamadosProvider>
      </PontosProvider>
    </FiliaisProvider>
  );
}
