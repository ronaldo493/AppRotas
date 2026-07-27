import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

import type { Filial } from '../type/Filial';
import { LatLng } from 'react-native-maps';
import { getCoordinates } from '../utils/coordinateUtils';

const isValidCoordinates = (coordinates: LatLng | null): coordinates is LatLng => {
  return coordinates !== null;
};

const getRouteCoordinates = (routes: readonly Filial[]): LatLng[] | null => {
  const coordinates = routes.map(
    getCoordinates,
  );

  if (!coordinates.every(isValidCoordinates)) {
    return null;
  }

  return coordinates;
};

const showEmptyRouteToast = (): void => {
  Toast.show({
    type: 'info',
    text1: 'Nenhuma filial adicionada',
    text2: 'Adicione ao menos uma filial para iniciar a navegação.',
    position: 'bottom',
  });
};

const showInvalidCoordinatesToast =
  (): void => {
    Toast.show({
      type: 'error',
      text1: 'Não foi possível abrir a rota',
      text2: 'Uma ou mais filiais possuem coordenadas inválidas.',
      position: 'bottom',
    });
  };

const showNavigationErrorToast = (navigatorName: string): void => {
  Toast.show({
    type: 'error',
    text1: `Não foi possível abrir o ${navigatorName}`,
    text2: 'Verifique se o aplicativo está disponível e tente novamente.',
    position: 'bottom',
  });
};

const openGoogleMapsRoute = async (routes: readonly Filial[]): Promise<boolean> => {
  if (routes.length === 0) {
    showEmptyRouteToast();

    return false;
  }

  const coordinates = getRouteCoordinates(routes);

  if (!coordinates) {
    showInvalidCoordinatesToast();

    return false;
  }

  const destinationCoordinates = coordinates[coordinates.length - 1];

  const destination = encodeURIComponent(
    [
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
    ].join(','),
  );

  /*
   * Todas as filiais anteriores à última
   * serão pontos intermediários da rota.
   */
  const waypoints = coordinates
    .slice(0, -1)
    .map(
      coordinate =>
        `${coordinate.latitude},${coordinate.longitude}`,
    )
    .join('|');

  const waypointsParameter = waypoints
    ? `&waypoints=${encodeURIComponent(
        waypoints,
      )}`
    : '';

  /*
   * Como não enviamos "origin", o Google Maps
   * utiliza a localização atual do aparelho.
   */
  const url =
    'https://www.google.com/maps/dir/?api=1' +
    `&destination=${destination}` +
    waypointsParameter +
    '&travelmode=driving';

  try {
    await Linking.openURL(url);

    return true;
  } catch (error: unknown) {
    console.error('Erro ao abrir Google Maps:', error,);

    showNavigationErrorToast('Google Maps',);

    return false;
  }
};

const openWazeRoute = async (routes: readonly Filial[]): Promise<boolean> => {
  if (routes.length === 0) {
    showEmptyRouteToast();

    return false;
  }

  const coordinates = getRouteCoordinates(routes);

  if (!coordinates) {
    showInvalidCoordinatesToast();

    return false;
  }

  /*
   * O fluxo atual do Waze abre somente
   * a última filial como destino.
   */
  const destinationCoordinates = coordinates[coordinates.length - 1];

  const destination = encodeURIComponent(
    [
      destinationCoordinates.latitude,
      destinationCoordinates.longitude,
    ].join(','),
  );

  const url =
    `waze://?ll=${destination}` +
    '&navigate=yes';

  try {
    await Linking.openURL(url);

    return true;
  } catch (error: unknown) {
    console.error('Erro ao abrir Waze:', error);

    Toast.show({
      type: 'error',
      text1: 'Waze não encontrado',
      text2: 'Instale o Waze para iniciar a navegação.',
      position: 'bottom',
    });

    return false;
  }
};

const MapService = {
  openGoogleMapsRoute,
  openWazeRoute,
};

export default MapService;