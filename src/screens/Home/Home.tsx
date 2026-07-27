import React, {useCallback, useEffect, useState,} from 'react';
import { Text, TouchableOpacity, View,} from 'react-native';
import { Button, Dialog, Portal,} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import RouteList from '../../components/RouteList/RouteList';
import SearchBar from '../../components/SearchBar/SearchBar';
import { useAppTheme } from '../../components/ThemeStyles';
import useAuth from '../../hooks/useAuth';
import useHistoryRoutes from '../../hooks/useHistoryRoutes';
import { addPendingHistory, syncPendingHistory,} from '../../services/PendingRouteHistory';
import type { Filial } from '../../type/Filial';
import HomeStyles from './styles/HomeStyles';
import useLocation from '../../hooks/useLocation';
import MapService from '../../services/MapService';

type NavigatorType = 'google' | 'waze';

export default function Home(): React.JSX.Element {
  const theme = useAppTheme();

  const { checkToken, token, message } = useAuth();
  const { postHistoricoRota,  loading: savingHistory } = useHistoryRoutes();

  const {
    currentCity,
    error: locationError,
    loading: loadingLocation,
    canAskAgain,
    ensureLocation,
    getLocation,
    openLocationSettings,
    currentLocation
  } = useLocation();

  const [routes, setRoutes] = useState<Filial[]>([]);
  const [hasSearchResult, setHasSearchResult] = useState(false);
  const [navigatorDialogVisible, setNavigatorDialogVisible] = useState(false);

  const hasRoutes = routes.length > 0;

  const synchronizePending = useCallback(
    async (showToast = false): Promise<void> => {
      await syncPendingHistory(postHistoricoRota);
    },
    [postHistoricoRota],
  );

  useEffect(() => {
    void ensureLocation();
  }, [ensureLocation]);

  useEffect(() => {
    if (token) {void checkToken(token); }
  }, [checkToken, token]);

  useEffect(() => {
    void synchronizePending();
  }, [synchronizePending]);

  const handleLocationAction = useCallback((): void => {
    if (loadingLocation) return;

    if (canAskAgain) {
      void getLocation(false);
      return;
    }

    void openLocationSettings();
  }, [
    canAskAgain,
    getLocation,
    loadingLocation,
    openLocationSettings,
  ]);

  const handleAddRoute = (filial: Filial): void => {
    const alreadyExists = routes.some(
      route =>
        route.codigofilial === filial.codigofilial,
    );

    if (alreadyExists) {
      Toast.show({
        type: 'info',
        text1: 'Filial já adicionada',
        text2: 'Essa filial já faz parte da rota.',
      });

      return;
    }

    setRoutes(current => [...current, filial]);
  };

  const handleRemoveRoute = ( filialToRemove: Filial): void => {
    setRoutes(current =>
      current.filter(
        filial =>
          filial.codigofilial !==
          filialToRemove.codigofilial,
      ),
    );
  };

  const saveHistory = async (): Promise<void> => {
    const datahora = new Date().toISOString();

    await synchronizePending();

    try {
      const saved = await postHistoricoRota(routes, datahora, false, currentCity);

      if (saved)  return;
    } catch {}

    await addPendingHistory(routes, datahora, currentCity);
  };

  const openNavigator = async (navigator: NavigatorType): Promise<void> => {
    setNavigatorDialogVisible(false);

    await saveHistory();

    if (navigator === 'google') {
      await MapService.openGoogleMapsRoute(routes);
      return;
    }

    await MapService.openWazeRoute(routes);
  };

  const handleTraceRoute = (): void => {
    if (!hasRoutes || savingHistory) return;

    setNavigatorDialogVisible(true);
  };

  return (
    <View style={[ HomeStyles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar
        currentLocation={currentLocation}
        onAddRoute={handleAddRoute}
        onResultChange={setHasSearchResult}
      />

      <View style={HomeStyles.routeContainer}>
        <View style={HomeStyles.content}>
          {!hasRoutes && !hasSearchResult ? (
            <View style={HomeStyles.emptyState}>
              <Text style={[ HomeStyles.emptyTitle, { color: theme.colors.onBackground}]}>
                Nenhuma filial selecionada
              </Text>

              <Text style={[ HomeStyles.emptyDescription, {color: theme.colors.onSurfaceVariant }]} >
                Digite o código da filial acima para iniciar sua rota.
              </Text>
            </View>
          ) : (
            <RouteList
              routes={routes}
              onRemoveRoute={handleRemoveRoute}
              onReorderRoutes={setRoutes}
            />
          )}
        </View>

        {message && (
          <View
            style={[
              HomeStyles.messageContainer,
              {
                backgroundColor:theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Text style={{ color: theme.colors.onSurfaceVariant}}>
              {message}
            </Text>
          </View>
        )}

        {locationError && !loadingLocation && (
          <View style={[
              HomeStyles.locationMessage,
              {
                backgroundColor: theme.colors.surface,
                borderColor:theme.colors.outline,
              },
            ]}
          >
            <MaterialIcons
              name="location-off"
              size={21}
              color={theme.colors.iconDefault}
            />

            <Text style={[HomeStyles.locationMessageText, {color: theme.colors.onSurfaceVariant}]} >
              {locationError}
            </Text>

            <TouchableOpacity
              onPress={handleLocationAction}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                canAskAgain
                  ? 'Tentar acessar localização novamente'
                  : 'Abrir configurações do aplicativo'
              }
            >
              <Text style={[HomeStyles.locationActionText, { color: theme.colors.primary}]}>
                {canAskAgain
                  ? 'Tentar novamente'
                  : 'Abrir configurações'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={handleTraceRoute}
          disabled={!hasRoutes || savingHistory}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{
            disabled: !hasRoutes || savingHistory,
          }}
          style={[
            HomeStyles.traceButton,
            {
              backgroundColor: hasRoutes
                ? theme.colors.actionBackground
                : theme.colors.buttonBackground,
              borderColor: hasRoutes
                ? theme.colors.actionBackground
                : theme.colors.outline,
              opacity:
                hasRoutes && !savingHistory ? 1 : 0.7,
            },
          ]}
        >
          <Text
            style={[
              HomeStyles.traceButtonText,
              {
                color: hasRoutes
                  ? theme.colors.actionForeground
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {savingHistory  ? 'Preparando rota...' : 'Traçar rota'}
          </Text>
        </TouchableOpacity>
      </View>

      <Portal>
        <Dialog
          visible={navigatorDialogVisible}
          onDismiss={() => setNavigatorDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface,}}
        >
          <Dialog.Title>
            Escolha o navegador
          </Dialog.Title>

          <Dialog.Content>
            <Text style={{color: theme.colors.onSurfaceVariant }}>
              Em qual aplicativo deseja abrir a rota?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setNavigatorDialogVisible(false) }>
              Cancelar
            </Button>

            <Button onPress={() => void openNavigator('waze') }>
              Waze
            </Button>

            <Button onPress={() => void openNavigator('google') }>
              Google Maps
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}