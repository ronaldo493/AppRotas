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
  getLocation: (showErrorToast?: boolean) => Promise<LatLng | null>;
  resolveCurrentCity: () => Promise<string | null>;
  openLocationSettings: () => Promise<void>;
}

export interface MapLocationContextValue {
  currentLocation: LatLng | null;
  currentCity: string | null;
  mapRegion: Region | null;
  loading: boolean;
}

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationContext = createContext<LocationContextValue | null>(null);
export const MapLocationContext =
  createContext<MapLocationContextValue | null>(null);

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
  const lastGeocodedCityRef = useRef<string | null>(null);
  const geocodeRequestRef = useRef<{
    locationKey: string;
    request: Promise<string | null>;
  } | null>(null);

  const updateCurrentCity = useCallback(
    async (coordinates: LatLng): Promise<string | null> => {
      const locationKey = [
        coordinates.latitude.toFixed(3),
        coordinates.longitude.toFixed(3),
      ].join(':');

      /*
      * Evita consultar novamente quando ocorrer
      * apenas uma pequena oscilação do GPS.
      */
      if (lastGeocodedLocationRef.current === locationKey) {
        return lastGeocodedCityRef.current;
      }

      if (geocodeRequestRef.current?.locationKey === locationKey) {
        return geocodeRequestRef.current.request;
      }

      const request = (async (): Promise<string | null> => {
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
          lastGeocodedCityRef.current = city;

          /*
           * Salva a chave somente depois que a
           * consulta for concluída.
           */
          lastGeocodedLocationRef.current = locationKey;

          return city;
        } catch (geocodeError: unknown) {
          console.error('Erro ao identificar cidade atual:', geocodeError);

          setCurrentCity(null);
          return null;
        }
      })();

      geocodeRequestRef.current = {locationKey, request};

      try {
        return await request;
      } finally {
        if (geocodeRequestRef.current?.request === request) {
          geocodeRequestRef.current = null;
        }
      }
    },
    [],
  );

  const applyLocation = useCallback(
    (
      location: Location.LocationObject,
      resolveCity = true,
    ): LatLng => {
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
      if (resolveCity) {
        void updateCurrentCity(coordinates);
      }

      return coordinates;
    },
    [updateCurrentCity],
  );

  const updateCurrentLocation = useCallback(
    async (
      resolveCity = true,
    ): Promise<LatLng> => {
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
        return applyLocation(
          lastKnownLocation,
          resolveCity,
        );
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

      return applyLocation(
        currentPosition,
        resolveCity,
      );
    },
    [applyLocation],
  );

  const ensureForegroundPermission = useCallback(
    async (showErrorToast: boolean): Promise<boolean> => {

      let permission = await Location.getForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      setCanAskAgain(permission.canAskAgain);

      if (permission.status === Location.PermissionStatus.GRANTED) {
        return true;
      }

      const message = getPermissionMessage(
        permission.canAskAgain,
      );

      setError(message);

      if (showErrorToast) {
        Toast.show({
          type: 'info',
          text1: 'Localização indisponível',
          text2: message,
        });
      }

      return false;
    },
    [],
  );

  const getLocation = useCallback(
    async (showErrorToast = true): Promise<LatLng | null> => {
      if (requestingRef.current) return null;

      requestingRef.current = true;
      requestedAutomaticallyRef.current = true;

      setLoading(true);
      setError(null);

      try {
        const hasPermission =
          await ensureForegroundPermission(
            showErrorToast,
          );

        if (!hasPermission) {
          return null;
        }

        return updateCurrentLocation();
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

        return null;
      } finally {
        requestingRef.current = false;
        setLoading(false);
      }
    },
    [
      ensureForegroundPermission,
      updateCurrentLocation,
    ],
  );

  /*
   * Fornece uma fotografia consistente da cidade para
   * registros de auditoria, aguardando a geocodificação
   * reversa quando ela ainda não tiver sido concluída.
   */
  const resolveCurrentCity = useCallback(
    async (): Promise<string | null> => {
      if (currentCity) return currentCity;

      if (currentLocation) {
        return updateCurrentCity(
          currentLocation,
        );
      }

      if (requestingRef.current) return null;

      requestingRef.current = true;
      requestedAutomaticallyRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const hasPermission = await ensureForegroundPermission(false);

        if (!hasPermission) return null;

        const coordinates = await updateCurrentLocation(false);

        return updateCurrentCity(coordinates);
      } catch (locationError: unknown) {
        console.error('Erro ao obter cidade para monitorar sessão:', locationError);

        return null;
      } finally {
        requestingRef.current = false;
        setLoading(false);
      }
    },
    [
      currentCity,
      currentLocation,
      ensureForegroundPermission,
      updateCurrentCity,
      updateCurrentLocation,
    ],
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
      resolveCurrentCity,
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
      resolveCurrentCity,
      openLocationSettings,
    ],
  );

  const mapValue = useMemo<MapLocationContextValue>(
    () => ({
      currentLocation,
      currentCity,
      mapRegion,
      loading,
    }),
    [
      currentLocation,
      currentCity,
      mapRegion,
      loading,
    ],
  );

  return (
    <LocationContext.Provider value={value}>
      <MapLocationContext.Provider value={mapValue}>
        {children}
      </MapLocationContext.Provider>
    </LocationContext.Provider>
  );
}
