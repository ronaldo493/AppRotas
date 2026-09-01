import React from 'react';

import {AssistentePreferencesProvider} from '../context/AssistentePreferencesContext';
import AssistenteGlobal from './AssistenteGlobal';

interface AssistenteFeatureProps {
  orquestradorHabilitado: boolean;
  sugestoesHabilitadas: boolean;
}

/** Ponto público único do módulo; providers internos não vazam para o app. */
export default function AssistenteFeature({
  orquestradorHabilitado,
  sugestoesHabilitadas,
}: AssistenteFeatureProps): React.JSX.Element {
  return (
    <AssistentePreferencesProvider>
      <AssistenteGlobal
        orquestradorHabilitado={orquestradorHabilitado}
        sugestoesHabilitadas={sugestoesHabilitadas}
      />
    </AssistentePreferencesProvider>
  );
}
