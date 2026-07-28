import { useContext } from 'react';

import {
  LocationContext,
  MapLocationContext,
  type LocationContextValue,
  type MapLocationContextValue,
} from './LocationContext';

export default function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error(
      'useLocation deve ser utilizado dentro de LocationProvider.',
    );
  }

  return context;
}

export function useMapLocation(): MapLocationContextValue {
  const context = useContext(MapLocationContext);

  if (!context) {
    throw new Error(
      'useMapLocation deve ser utilizado dentro de LocationProvider.',
    );
  }

  return context;
}
