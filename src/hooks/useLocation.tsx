import { useContext } from 'react';

import {LocationContext, type LocationContextValue} from '../context/LocationContext';

export default function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      'useLocation deve ser utilizado dentro de LocationProvider.',
    );
  }

  return context;
}