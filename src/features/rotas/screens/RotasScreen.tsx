import React, {useCallback, useEffect, useState,} from 'react';
import { Text, TouchableOpacity, View,} from 'react-native';
import { Button, Dialog, Portal,} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import useLocation from '../../../core/location/useLocation';
import FilialSearch from '../../filiais/components/FilialSearch';
import type {Filial} from '../../filiais/models/Filial';
import useHistoricoRotas from '../../historico/hooks/useHistoricoRotas';
import {TIPO_HISTORICO} from '../../historico/models/Historico';
import {registrarHistoricoRota} from '../../historico/useCases/registrarHistoricoRota';
import useHistoricoOffline from '../../historico/hooks/useHistoricoOffline';
import RouteList from '../components/RouteList';
import {useRotasContext} from '../RotasContext';
import MapService from '../services/mapService';
import HomeStyles from './rotasScreen.styles';

type NavigatorType = 'google' | 'waze';

export default function RotasScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const { postHistoricoRota,  loading: savingHistory } = useHistoricoRotas();
  const {
    adicionarHistoricoPendente,
    sincronizarHistoricosPendentes,
  } = useHistoricoOffline();

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

  const {rotas: routes, setRotas: setRoutes} = useRotasContext();
  const [hasSearchResult, setHasSearchResult] = useState(false);
  const [navigatorDialogVisible, setNavigatorDialogVisible] = useState(false);

  const hasRoutes = routes.length > 0;

  const synchronizePending = useCallback(
    async (): Promise<void> => {
      try {
        await sincronizarHistoricosPendentes(
          postHistoricoRota,
        );
      } catch (error: unknown) {
        console.error(
          'Erro ao acessar o histórico offline:',
          error instanceof Error
            ? error.message
            : 'erro desconhecido',
        );
      }
    },
    [
      postHistoricoRota,
      sincronizarHistoricosPendentes,
    ],
  );

  useEffect(() => {
    void ensureLocation();
  }, [ensureLocation]);

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

  const openNavigatorDialog = useCallback((): void => {
    if (savingHistory) return;
    setNavigatorDialogVisible(true);
  }, [savingHistory]);

  const handleTraceRoute = useCallback((): void => {
    if (!hasRoutes) return;

    openNavigatorDialog();
  }, [hasRoutes, openNavigatorDialog]);

  const openNavigator = async (navigator: NavigatorType): Promise<void> => {
    setNavigatorDialogVisible(false);

    const resultadoHistorico =
      await registrarHistoricoRota(
        {
          rotas: routes,
          cidadeOrigem: currentCity,
          tipoHistorico:
            TIPO_HISTORICO.LOJA,
        },
        {
          enviar: postHistoricoRota,
          sincronizar:
            sincronizarHistoricosPendentes,
          adicionarPendente:
            adicionarHistoricoPendente,
        },
      );

    if (resultadoHistorico.status === 'falha') {
      console.error(
        'Erro ao guardar histórico da rota:',
        resultadoHistorico.erro,
      );
    }

    if (navigator === 'google') {
      await MapService.openGoogleMapsRoute(routes);
      return;
    }

    await MapService.openWazeRoute(routes);
  };

  return (
    <View style={[ HomeStyles.container, { backgroundColor: theme.colors.background }]}>
      <FilialSearch
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
                Digite o código da filial ou use o assistente.
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
