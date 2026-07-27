import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as Location from 'expo-location';
import {AppState,  Linking, type AppStateStatus} from 'react-native';
import Toast from 'react-native-toast-message';
import type { LatLng, Region,} from 'react-native-maps';

export interface LocationContextValue {
  currentLocation: LatLng | null;
  currentCity: string | null;
  mapRegion: Region | null;
  error: string | null;
  loading: boolean;
  canAskAgain: boolean;
  ensureLocation: () => Promise<void>;
  getLocation: (showErrorToast?: boolean,) => Promise<boolean>;
  openLocationSettings: () => Promise<void>;
}

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationContext = createContext<LocationContextValue | null>(null);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Não foi possível obter sua localização.';
};

const getPermissionMessage = ( canAskAgain: boolean): string =>
  canAskAgain
    ? 'Permita o acesso a localização para o perfeito funcionamento do aplicativo de rotas.'
    : 'Ative a localização nas configurações.';

export function LocationProvider({children}: LocationProviderProps): React.JSX.Element {
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const requestingRef = useRef(false);
  const requestedAutomaticallyRef = useRef(false);
  const settingsOpenedRef = useRef(false);
  const lastGeocodedLocationRef = useRef<string | null>(null);

  const updateCurrentCity = useCallback(
    async (coordinates: LatLng,): Promise<void> => {
      const locationKey = [
        coordinates.latitude.toFixed(3),
        coordinates.longitude.toFixed(3),
      ].join(':');

      /*
      * Evita consultar novamente quando ocorrer
      * apenas uma pequena oscilação do GPS.
      */
      if (lastGeocodedLocationRef.current === locationKey) return;

      try {
        const addresses =
          await Location.reverseGeocodeAsync({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          });

        const address = addresses[0];

        const city =
          address?.city?.trim() ||
          address?.subregion?.trim() ||
          null;

        setCurrentCity(city);

        /*
        * Salva a chave somente depois que a
        * consulta for concluída.
        */
        lastGeocodedLocationRef.current = locationKey;
      } catch (geocodeError: unknown) {
        console.error('Erro ao identificar cidade atual:', geocodeError);

        setCurrentCity(null);
      }
    },
    [],
  );

  const applyLocation = useCallback(
    (location: Location.LocationObject): void => {
      const coordinates: LatLng = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coordinates);

      setMapRegion({
        ...coordinates,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      setError(null);

      /*
     * Não bloqueia a exibição do mapa enquanto
     * a cidade é identificada.
     */
      void updateCurrentCity(coordinates);
    },
    [],
  );

  const updateCurrentLocation = useCallback(
    async (): Promise<boolean> => {
      /*
      * Tenta aproveitar uma localização obtida
      * nos últimos 60 segundos e com precisão
      * de até 250 metros.
      */
      const lastKnownLocation =
        await Location.getLastKnownPositionAsync({
          maxAge: 60_000,
          requiredAccuracy: 250,
        });

      if (lastKnownLocation) {
        applyLocation(lastKnownLocation);

        return true;
      }

      /*
      * Se não houver uma localização recente,
      * solicita uma nova leitura ao aparelho.
      */
      const currentPosition =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });

      applyLocation(currentPosition);

      return true;
    },
    [applyLocation],
  );

  const getLocation = useCallback(
    async (showErrorToast = true): Promise<boolean> => {
      if (requestingRef.current) return false;

      requestingRef.current = true;
      requestedAutomaticallyRef.current = true;

      setLoading(true);
      setError(null);

      try {
        let permission = await Location.getForegroundPermissionsAsync();

        if (permission.status !== Location.PermissionStatus.GRANTED && permission.canAskAgain) {
          permission = await Location.requestForegroundPermissionsAsync();
        }

        setCanAskAgain(permission.canAskAgain);

        if (permission.status !== Location.PermissionStatus.GRANTED) {
          const message = getPermissionMessage(permission.canAskAgain);

          setError(message);

          if (showErrorToast) {
            Toast.show({
              type: 'info',
              text1: 'Localização indisponível',
              text2: message,
            });
          }

          return false;
        }

        return await updateCurrentLocation();
      } catch (err: unknown) {
        const message = getErrorMessage(err);

        console.error('Erro ao obter localização:', err);

        setError(message);

        if (showErrorToast) {
          Toast.show({
            type: 'error',
            text1: 'Erro de localização',
            text2: message,
          });
        }

        return false;
      } finally {
        requestingRef.current = false;
        setLoading(false);
      }
    },
    [updateCurrentLocation],
  );

  /*
   * Utilizado pelas telas para solicitar automaticamente
   * apenas uma vez durante a sessão.
   */
  const ensureLocation =useCallback(async (): Promise<void> => {
      if (requestedAutomaticallyRef.current || currentLocation ) return;

      requestedAutomaticallyRef.current = true;

      await getLocation();
    }, [currentLocation, getLocation]);

  const openLocationSettings = useCallback(async (): Promise<void> => {
      try {
        settingsOpenedRef.current = true;

        await Linking.openSettings();
      } catch (err: unknown) {
        console.error('Erro ao abrir configurações:', err);

        Toast.show({
          type: 'error',
          text1: 'Erro ao abrir configurações',
          text2: 'Abra as configurações do aplicativo e permita o acesso à localização.',
        });
      }
    }, []);

  /*
   * Ao voltar das configurações, verifica se a
   * permissão foi concedida.
   */
  useEffect(() => {
    const handleAppStateChange = async (state: AppStateStatus): Promise<void> => {
      if (state !== 'active' || !settingsOpenedRef.current) return;

      settingsOpenedRef.current = false;

      try {
        const permission = await Location.getForegroundPermissionsAsync();

        setCanAskAgain(permission.canAskAgain);

        if (permission.status === Location.PermissionStatus.GRANTED) {
          setLoading(true);

          await updateCurrentLocation();

          return;
        }

        setError(getPermissionMessage(permission.canAskAgain),
        );
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    const subscription =
      AppState.addEventListener(
        'change',
        state => {void handleAppStateChange(state)},
      );

    return () => {
      subscription.remove();
    };
  }, [updateCurrentLocation]);

  const value = useMemo<LocationContextValue>(
    () => ({
      currentLocation,
      currentCity,
      mapRegion,
      error,
      loading,
      canAskAgain,
      ensureLocation,
      getLocation,
      openLocationSettings,
    }),
    [
      currentLocation,
      currentCity,
      mapRegion,
      error,
      loading,
      canAskAgain,
      ensureLocation,
      getLocation,
      openLocationSettings,
    ],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}