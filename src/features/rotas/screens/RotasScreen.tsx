import React, {useCallback, useEffect, useRef, useState,} from 'react';
import { Text, TouchableOpacity, View,} from 'react-native';
import { Button, Dialog, Portal,} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import useLocation from '../../../core/location/useLocation';
import useNavegacaoMonitorada from '../../execucaoRota/hooks/useNavegacaoMonitorada';
import {definirFluxoMonitoramentoRota} from '../../execucaoRota/useCases/definirFluxoMonitoramentoRota';
import FilialSearch from '../../filiais/components/FilialSearch';
import type {Filial} from '../../filiais/models/Filial';
import type {PlanejamentoExecucaoRota} from '../../execucaoRota/models/ExecucaoRota';
import RouteList from '../components/RouteList';
import RoutePreviewModal from '../components/RoutePreviewModal';
import type {RoutePreview} from '../models/RoutePreview';
import {useRotasContext} from '../RotasContext';
import HomeStyles from './rotasScreen.styles';

type NavigatorType = 'google' | 'waze';

export default function RotasScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {
    execucaoAtiva,
    processando,
    iniciarNavegacao,
    interromperNavegacao,
    verificarMonitoramento,
  } = useNavegacaoMonitorada();

  const {
    currentCity,
    error: locationError,
    loading: loadingLocation,
    ensureLocation,
    openLocationSettings,
    currentLocation
  } = useLocation();

  const {
    rotas: routes,
    setRotas: setRoutes,
    solicitacaoTracadoId,
  } = useRotasContext();
  const solicitacaoTratadaRef = useRef(0);
  const [hasSearchResult, setHasSearchResult] = useState(false);
  const [routePreviewVisible, setRoutePreviewVisible] =
    useState(false);
  const [navigatorDialogVisible, setNavigatorDialogVisible] = useState(false);
  const [
    monitoringEnabledForFlow,
    setMonitoringEnabledForFlow,
  ] = useState(false);
  const [
    selectedPlanning,
    setSelectedPlanning,
  ] = useState<PlanejamentoExecucaoRota | undefined>(
    undefined,
  );
  const [interruptionDialogVisible, setInterruptionDialogVisible] =
    useState(false);

  const hasRoutes = routes.length > 0;

  useEffect(() => {
    void ensureLocation();
  }, [ensureLocation]);

  const handleLocationAction = useCallback((): void => {
    if (loadingLocation) return;

    void openLocationSettings();
  }, [
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

  /**
   * A escolha do navegador confirma o início. A prévia já foi exibida antes,
   * portanto não é necessário outro diálogo intermediário.
   */
  const startNavigation = async (
    navigator: NavigatorType,
  ): Promise<void> => {
    if (processando) return;

    setNavigatorDialogVisible(false);

    await iniciarNavegacao({
      rotas: routes,
      navegador: navigator,
      cidadeOrigem: currentCity,
      tipoDestino: 'loja',
      monitorar: monitoringEnabledForFlow,
      planejamento: selectedPlanning,
    });
  };

  const handleTraceRoute = useCallback(async (): Promise<void> => {
    if (processando) return;

    if (execucaoAtiva) {
      setInterruptionDialogVisible(true);
      return;
    }

    if (!hasRoutes) return;

    const monitoringConfiguration =
      await verificarMonitoramento();
    const monitoringFlow =
      definirFluxoMonitoramentoRota(
        monitoringConfiguration,
      );

    setMonitoringEnabledForFlow(
      monitoringFlow.monitorar,
    );
    setSelectedPlanning(undefined);

    if (
      monitoringFlow.exibirPrevia
    ) {
      setRoutePreviewVisible(true);
      return;
    }

    setNavigatorDialogVisible(true);
  }, [
    execucaoAtiva,
    hasRoutes,
    processando,
    verificarMonitoramento,
  ]);

  useEffect(() => {
    if (
      solicitacaoTracadoId === 0 ||
      solicitacaoTratadaRef.current >= solicitacaoTracadoId
    ) {
      return;
    }

    solicitacaoTratadaRef.current = solicitacaoTracadoId;

    if (hasRoutes) {
      void handleTraceRoute();
    }
  }, [handleTraceRoute, hasRoutes, solicitacaoTracadoId]);

  /**
   * A prévia é somente consulta. A escolha do navegador acontece depois que
   * o usuário confirma explicitamente que deseja iniciar o percurso.
   */
  const handleStartPreviewedRoute = (
    preview: RoutePreview,
  ): void => {
    setSelectedPlanning({
      servidorDocumentId: null,
      trajetoPlanejado:
        preview.encodedPolyline,
      distanciaPlanejadaMetros:
        preview.distanceMeters,
      duracaoPlanejadaSegundos:
        preview.durationSeconds,
    });
    setRoutePreviewVisible(false);
    setNavigatorDialogVisible(true);
  };

  const handleStartWithoutPreview = (): void => {
    setSelectedPlanning(undefined);
    setRoutePreviewVisible(false);
    setNavigatorDialogVisible(true);
  };

  const handleInterruptRoute =
    async (): Promise<void> => {
      if (processando || !execucaoAtiva) return;

      const interrupted =
        await interromperNavegacao();

      if (!interrupted) {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível interromper',
          text2:
            'A rota continua preservada. Tente novamente em alguns instantes.',
          position: 'bottom',
        });
        return;
      }

      setInterruptionDialogVisible(false);

      Toast.show({
        type: 'info',
        text1: 'Percurso interrompido',
        text2:
          'Os destinos confirmados e o trajeto realizado foram preservados.',
        position: 'bottom',
      });
    };

  return (
    <View style={[ HomeStyles.container, { backgroundColor: theme.colors.background }]}>
      <FilialSearch
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
              accessibilityLabel="Abrir configurações do aplicativo"
            >
              <Text style={[HomeStyles.locationActionText, { color: theme.colors.primary}]}>
                Abrir configurações
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          onPress={() => {
            void handleTraceRoute();
          }}
          disabled={
            processando ||
            (!hasRoutes && !execucaoAtiva)
          }
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{
            disabled:
              processando ||
              (!hasRoutes && !execucaoAtiva),
          }}
          style={[
            HomeStyles.traceButton,
            {
              backgroundColor:
                hasRoutes || execucaoAtiva
                ? theme.colors.actionBackground
                : theme.colors.buttonBackground,
              borderColor:
                hasRoutes || execucaoAtiva
                ? theme.colors.actionBackground
                : theme.colors.outline,
              opacity:
                !processando &&
                (hasRoutes || execucaoAtiva)
                  ? 1
                  : 0.7,
            },
          ]}
        >
          <Text
            style={[
              HomeStyles.traceButtonText,
              {
                color:
                  hasRoutes || execucaoAtiva
                  ? theme.colors.actionForeground
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {processando
              ? 'Iniciando viagem...'
              : execucaoAtiva
                ? 'Rota em andamento'
                : 'Traçar rota'}
          </Text>
        </TouchableOpacity>
      </View>

      <Portal>
        <Dialog
          visible={navigatorDialogVisible}
          dismissable={!processando}
          onDismiss={() => setNavigatorDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface,}}
        >
          <Dialog.Title>
            Iniciar percurso
          </Dialog.Title>

          <Dialog.Content>
            {monitoringEnabledForFlow ? (
            <Text style={{color: theme.colors.onSurfaceVariant }}>
              Escolha o navegador. A partir desta confirmação, o percurso será
              registrado até a chegada aos destinos ou sua interrupção.
            </Text>
            ) : (
              <Text
                style={{
                  color:
                    theme.colors.onSurfaceVariant,
                }}
              >
                Escolha onde deseja abrir a rota.
              </Text>
            )}
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              disabled={processando}
              onPress={() => setNavigatorDialogVisible(false)}
            >
              Cancelar
            </Button>

            <Button
              disabled={processando}
              onPress={() =>
                void startNavigation('waze')
              }
            >
              Waze
            </Button>

            <Button
              disabled={processando}
              onPress={() =>
                void startNavigation('google')
              }
            >
              Google Maps
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={interruptionDialogVisible}
          dismissable={!processando}
          onDismiss={() => {
            if (!processando) {
              setInterruptionDialogVisible(false);
            }
          }}
          style={{backgroundColor: theme.colors.surface}}
        >
          <Dialog.Title>Rota em andamento</Dialog.Title>

          <Dialog.Content>
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
              }}
            >
              A rota será concluída automaticamente quando todos os destinos
              forem confirmados. Interrompa somente se o percurso não for mais
              realizado.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              disabled={processando}
              onPress={() =>
                setInterruptionDialogVisible(false)
              }
            >
              Manter rota
            </Button>

            <Button
              loading={processando}
              disabled={processando}
              onPress={() => void handleInterruptRoute()}
            >
              Interromper
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <RoutePreviewModal
        visible={routePreviewVisible}
        origin={currentLocation}
        routes={routes}
        starting={processando}
        onClose={() =>
          setRoutePreviewVisible(false)
        }
        onStart={handleStartPreviewedRoute}
        onStartWithoutPreview={handleStartWithoutPreview}
        onRequestLocation={handleLocationAction}
      />
    </View>
  );
}
