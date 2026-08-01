import React from 'react';

import {AssistentePreferencesProvider} from '../context/AssistentePreferencesContext';
import AssistenteGlobal from './AssistenteGlobal';

interface AssistenteFeatureProps {
  iaHabilitada: boolean;
}

/** Ponto público único do módulo; providers internos não vazam para o app. */
export default function AssistenteFeature({
  iaHabilitada,
}: AssistenteFeatureProps): React.JSX.Element {
  return (
    <AssistentePreferencesProvider>
      <AssistenteGlobal iaHabilitada={iaHabilitada} />
    </AssistentePreferencesProvider>
  );
}
