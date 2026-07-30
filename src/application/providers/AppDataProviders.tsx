import React, {
  type PropsWithChildren,
} from 'react';

import {ChamadosProvider} from '../../features/chamados/ChamadosContext';
import {FiliaisProvider} from '../../features/filiais/FiliaisContext';
import {HistoricoProvider} from '../../features/historico/HistoricoContext';
import {PontosProvider} from '../../features/pontos/PontosContext';
import {RotasProvider} from '../../features/rotas/RotasContext';

export default function AppDataProviders({
  children,
}: PropsWithChildren): React.JSX.Element {
  return (
    <FiliaisProvider>
      <RotasProvider>
        <PontosProvider>
          <ChamadosProvider>
            <HistoricoProvider>
              {children}
            </HistoricoProvider>
          </ChamadosProvider>
        </PontosProvider>
      </RotasProvider>
    </FiliaisProvider>
  );
}
