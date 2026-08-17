import React, {useCallback, useEffect, useRef, useState,} from 'react';
import { Text, TouchableOpacity, View,} from 'react-native';
import { Button, Dialog, Portal,} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import useLocation from '../../../core/location/useLocation';
import ConfirmacaoPermissaoRastreamentoDialog from '../../execucaoRota/components/ConfirmacaoPermissaoRastreamentoDialog';
import useNavegacaoMonitorada from '../../execucaoRota/hooks/useNavegacaoMonitorada';
import {definirFluxoMonitoramentoRota} from '../../execucaoRota/useCases/definirFluxoMonitoramentoRota';
import FilialSearch from '../../filiais/components/FilialSearch';
import type {Filial} from '../../filiais/models/Filial';
import type {PlanejamentoExecucaoRota} from '../../execucaoRota/models/ExecucaoRota';
import RouteList from '../components/RouteList';
import RoutePreviewModal from '../components/RoutePreviewModal';
import type {RoutePreview} from '../models/RoutePreview';
import useFiliaisRotaOffline from '../hooks/useFiliaisRotaOffline';
import usePrepararOrigemPreviaRota from '../hooks/usePrepararOrigemPreviaRota';
import {useRotasContext} from '../RotasContext';
import {iniciarNovaRotaAposInterrupcao} from '../useCases/iniciarNovaRotaAposInterrupcao';
import HomeStyles from './rotasScreen.styles';

type NavigatorType = 'google' | 'waze';
type InterruptionDialogMode = 'manage' | 'replace' | null;

export default function RotasScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const filiaisRota = useFiliaisRotaOffline();
  const {
    execucaoAtiva,
    processando,
    iniciarNavegacao,
    interromperNavegacao,
    verificarMonitoramento,
    confirmacaoPermissaoVisivel,
    confirmarPermissaoRastreamento,
    cancelarPermissaoRastreamento,
  } = useNavegacaoMonitorada();

  const {
    error: locationError,
    loading: loadingLocation,
    ensureLocation,
    openLocationSettings,
    currentLocation,
    currentLocationSnapshot,
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
  const [interruptionDialogMode, setInterruptionDialogMode] =
    useState<InterruptionDialogMode>(null);
  const [replaceActiveRoute, setReplaceActiveRoute] =
    useState(false);

  const hasRoutes = routes.length > 0;
  usePrepararOrigemPreviaRota(
    hasRoutes,
    currentLocationSnapshot,
  );

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

  /** Limpa somente a seleção usada para montar a rota que acabou de abrir. */
  const handleNavigationStarted = useCallback((): void => {
    setRoutes([]);
    setHasSearchResult(false);
  }, [setRoutes]);

  /**
   * A escolha do navegador confirma o início. A prévia já foi exibida antes,
   * portanto não é necessário outro diálogo intermediário.
   */
  const startNavigation = async (
    navigator: NavigatorType,
  ): Promise<void> => {
    if (processando) return;

    setNavigatorDialogVisible(false);

    const start = (): Promise<boolean> =>
      iniciarNavegacao({
        rotas: routes,
        navegador: navigator,
        tipoDestino: 'loja',
        monitorar: monitoringEnabledForFlow,
        planejamento: selectedPlanning,
        onStarted: handleNavigationStarted,
      });

    if (replaceActiveRoute && execucaoAtiva) {
      const interruptionSucceeded =
        await iniciarNovaRotaAposInterrupcao(
          interromperNavegacao,
          start,
        );

      setReplaceActiveRoute(false);

      if (!interruptionSucceeded) {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível trocar a rota',
          text2:
            'A rota atual continua preservada. Tente novamente em alguns instantes.',
          position: 'bottom',
        });
      }

      return;
    }

    setReplaceActiveRoute(false);
    await start();
  };

  /**
   * A prévia continua sendo apenas uma consulta. A existência de uma rota
   * ativa só muda a etapa seguinte, sem impedir o cálculo de tempo e distância.
   */
  const openStartFlow = useCallback((): void => {
    if (execucaoAtiva) {
      setInterruptionDialogMode('replace');
      return;
    }

    setReplaceActiveRoute(false);
    setNavigatorDialogVisible(true);
  }, [execucaoAtiva]);

  const handleTraceRoute = useCallback(async (): Promise<void> => {
    if (processando) return;

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

    openStartFlow();
  }, [
    hasRoutes,
    openStartFlow,
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
    openStartFlow();
  };

  const handleStartWithoutPreview = (): void => {
    setSelectedPlanning(undefined);
    setRoutePreviewVisible(false);
    openStartFlow();
  };

  /** Interrompe a rota atual sem iniciar outro percurso. */
  const handleInterruptCurrentRoute =
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

      setInterruptionDialogMode(null);

      Toast.show({
        type: 'info',
        text1: 'Percurso interrompido',
        text2:
          'Os destinos confirmados e o trajeto realizado foram preservados.',
        position: 'bottom',
      });
    };

  /**
   * Prossegue para a escolha do navegador sem interromper imediatamente. Se o
   * usuário cancelar a próxima etapa, a execução atual permanece intacta.
   */
  const handleConfirmRouteReplacement = (): void => {
    setInterruptionDialogMode(null);
    setReplaceActiveRoute(true);
    setNavigatorDialogVisible(true);
  };

  const handleCloseNavigatorDialog = (): void => {
    if (processando) return;

    setNavigatorDialogVisible(false);
    setReplaceActiveRoute(false);
  };

  return (
    <View style={[ HomeStyles.container, { backgroundColor: theme.colors.background }]}>
      <FilialSearch
        onAddRoute={handleAddRoute}
        onResultChange={setHasSearchResult}
        filiais={filiaisRota.filiais}
        loadingFiliais={filiaisRota.loading}
        filiaisError={filiaisRota.error}
        usandoDadosSalvos={filiaisRota.usandoDadosSalvos}
        dadosOnlineIndisponiveis={
          filiaisRota.dadosOnlineIndisponiveis
        }
        cacheAtualizadoEm={filiaisRota.cacheAtualizadoEm}
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
            !hasRoutes
          }
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{
            disabled:
              processando ||
              !hasRoutes,
          }}
          style={[
            HomeStyles.traceButton,
            {
              backgroundColor:
                hasRoutes
                ? theme.colors.actionBackground
                : theme.colors.buttonBackground,
              borderColor:
                hasRoutes
                ? theme.colors.actionBackground
                : theme.colors.outline,
              opacity:
                !processando &&
                hasRoutes
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
                  hasRoutes
                  ? theme.colors.actionForeground
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {processando
              ? 'Iniciando viagem...'
              : 'Traçar rota'}
          </Text>
        </TouchableOpacity>

        {execucaoAtiva && (
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Gerenciar rota em andamento"
            disabled={processando}
            onPress={() =>
              setInterruptionDialogMode('manage')
            }
            style={HomeStyles.activeRouteAction}
          >
            <Text
              style={[
                HomeStyles.activeRouteActionText,
                {color: theme.colors.primary},
              ]}
            >
              Gerenciar rota em andamento
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Portal>
        <Dialog
          visible={navigatorDialogVisible}
          dismissable={!processando}
          onDismiss={handleCloseNavigatorDialog}
          style={{ backgroundColor: theme.colors.surface,}}
        >
          <Dialog.Title>
            Iniciar percurso
          </Dialog.Title>

          <Dialog.Content>
            {replaceActiveRoute ? (
              <Text style={{color: theme.colors.onSurfaceVariant}}>
                Ao escolher o navegador, a rota atual será interrompida e o
                novo percurso será iniciado.
              </Text>
            ) : monitoringEnabledForFlow ? (
              <Text style={{color: theme.colors.onSurfaceVariant}}>
                Escolha o navegador. A partir desta confirmação, o percurso
                será registrado até a chegada aos destinos ou sua interrupção.
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
              onPress={handleCloseNavigatorDialog}
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
          visible={interruptionDialogMode !== null}
          dismissable={!processando}
          onDismiss={() => {
            if (!processando) {
              setInterruptionDialogMode(null);
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
              {interruptionDialogMode === 'replace'
                ? 'Para iniciar este novo percurso, a rota atual precisará ser interrompida. Ela continuará ativa caso você desista antes de escolher o navegador.'
                : 'A rota será concluída automaticamente quando todos os destinos forem confirmados. Interrompa somente se o percurso não for mais realizado.'}
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              disabled={processando}
              onPress={() =>
                setInterruptionDialogMode(null)
              }
            >
              Manter rota atual
            </Button>

            <Button
              disabled={processando}
              loading={
                processando &&
                interruptionDialogMode === 'manage'
              }
              onPress={() => {
                if (interruptionDialogMode === 'replace') {
                  handleConfirmRouteReplacement();
                  return;
                }

                void handleInterruptCurrentRoute();
              }}
            >
              {interruptionDialogMode === 'replace'
                ? 'Continuar'
                : 'Interromper'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <RoutePreviewModal
        visible={routePreviewVisible}
        origin={currentLocation}
        originSnapshot={currentLocationSnapshot}
        routes={routes}
        starting={processando}
        onClose={() =>
          setRoutePreviewVisible(false)
        }
        onStart={handleStartPreviewedRoute}
        onStartWithoutPreview={handleStartWithoutPreview}
        onRequestLocation={handleLocationAction}
      />

      <ConfirmacaoPermissaoRastreamentoDialog
        visible={confirmacaoPermissaoVisivel}
        onConfirm={confirmarPermissaoRastreamento}
        onDismiss={cancelarPermissaoRastreamento}
      />
    </View>
  );
}
