import React from 'react';

import AssistenteFeature from '../../features/assistente/components/AssistenteFeature';
import useDisponibilidadeAssistente from '../../features/assistente/hooks/useDisponibilidadeAssistente';
import {definirAcaoGlobal} from '../../features/assistente/useCases/definirAcaoGlobal';
import SugestaoFab from '../../features/sugestoes/components/SugestaoFab';

/**
 * Única composição entre a funcionalidade opcional e o aplicativo. Para
 * remover a assistente no futuro, basta manter somente o fallback deste slot.
 */
export default function GlobalSupportAction(): React.JSX.Element {
  const {habilitado, iaHabilitada, orquestradorHabilitado, sugestoesHabilitadas} =
    useDisponibilidadeAssistente();
  const acaoGlobal = definirAcaoGlobal(habilitado);

  return acaoGlobal === 'assistente'
    ? <AssistenteFeature
        iaHabilitada={iaHabilitada}
        orquestradorHabilitado={orquestradorHabilitado}
        sugestoesHabilitadas={sugestoesHabilitadas}
      />
    : <SugestaoFab />;
}
