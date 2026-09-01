import React, {useCallback, useEffect, useRef, useState,} from 'react';
import { Text, TouchableOpacity, View,} from 'react-native';
import { Button, Dialog, Portal,} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {useAuthContext} from '../../../core/auth/AuthContext';
import {getAuthUserKey} from '../../../core/auth/getAuthUserKey';
import {useAppTheme} from '../../../core/theme/appTheme';
import useLocation from '../../../core/location/useLocation';
import ConfirmacaoPermissaoRastreamentoDialog from '../../execucaoRota/components/ConfirmacaoPermissaoRastreamentoDialog';
import RouteAssistantMic from '../../assistente/integrations/rotas/RouteAssistantMic';
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
import useRoutePreview from '../hooks/useRoutePreview';
import {useRotasContext} from '../RotasContext';
import {
  obterNavegadorPreferido,
  registrarNavegadorUsado,
  resolverNavegadorRota,
} from '../services/navigationPreferenceService';
import {iniciarNovaRotaAposInterrupcao} from '../useCases/iniciarNovaRotaAposInterrupcao';
import {formatarEstimativaRotaAssistente} from '../useCases/formatarEstimativaRotaAssistente';
import HomeStyles from './rotasScreen.styles';

type NavigatorType = 'google' | 'waze';
type InterruptionDialogMode = 'manage' | 'replace' | null;

export default function RotasScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {user} = useAuthContext();
  const userKey = getAuthUserKey(user);
  const filiaisRota = useFiliaisRotaOffline();
  const previaAssistida = useRoutePreview();
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
    getLocation,
    openLocationSettings,
    currentLocation,
    currentLocationSnapshot,
  } = useLocation();

  const {
    rotas: routes,
    setRotas: setRoutes,
    solicitacaoTracado,
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
  const [processandoFluxoAssistido, setProcessandoFluxoAssistido] =
    useState(false);
  const [navegadorDiretoPendente, setNavegadorDiretoPendente] =
    useState<NavigatorType | null>(null);
  const feedbackTracadoRef = useRef<
    ((texto: string, textoFalado?: string) => void) | null
  >(null);
  const estimativaTracadoRef = useRef<{
    visual: string;
    falada: string;
  } | null>(null);

  const hasRoutes = routes.length > 0;
  const interfaceOcupada = processando || processandoFluxoAssistido;
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
  const handleNavigationStarted = useCallback((
    navegador: NavigatorType,
  ): void => {
    void registrarNavegadorUsado(userKey, navegador);
    setRoutes([]);
    setHasSearchResult(false);
    const navegadorNome = navegador === 'google' ? 'Google Maps' : 'Waze';
    const abertura = `Abri a rota no ${navegadorNome}.`;
    const estimativa = estimativaTracadoRef.current;
    feedbackTracadoRef.current?.(
      estimativa ? `${estimativa.visual} ${abertura}` : abertura,
      estimativa ? `${estimativa.falada} ${abertura}` : abertura,
    );
    estimativaTracadoRef.current = null;
    feedbackTracadoRef.current = null;
  }, [setRoutes, userKey]);

  /**
   * A escolha do navegador confirma o início. A prévia já foi exibida antes,
   * portanto não é necessário outro diálogo intermediário.
   */
  const startNavigation = async (
    navigator: NavigatorType,
    opcoes: {
      planejamento?: PlanejamentoExecucaoRota;
      monitorar?: boolean;
      substituirExecucaoAtiva?: boolean;
    } = {},
  ): Promise<void> => {
    if (processando) return;

    setNavigatorDialogVisible(false);

    const start = (): Promise<boolean> =>
      iniciarNavegacao({
        rotas: routes,
        navegador: navigator,
        tipoDestino: 'loja',
        monitorar:
          opcoes.monitorar ?? monitoringEnabledForFlow,
        planejamento:
          opcoes.planejamento ?? selectedPlanning,
        onStarted: () => handleNavigationStarted(navigator),
      });

    if (
      (opcoes.substituirExecucaoAtiva ?? replaceActiveRoute) &&
      execucaoAtiva
    ) {
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
    if (interfaceOcupada) return;

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
    interfaceOcupada,
    openStartFlow,
    verificarMonitoramento,
  ]);

  /**
   * Atende pedidos explícitos da assistente sem abrir o mapa de prévia. A
   * estimativa continua usando a mesma regra de localização, cache e quota do
   * fluxo manual; iniciar o monitoramento ainda exige abrir o navegador.
   */
  const handleTraceRouteDirectly = useCallback(async (): Promise<void> => {
    if (interfaceOcupada || !solicitacaoTracado || !hasRoutes) return;

    setProcessandoFluxoAssistido(true);
    feedbackTracadoRef.current = solicitacaoTracado.onFeedback ?? null;
    estimativaTracadoRef.current = null;

    try {
      const configuracao = await verificarMonitoramento();
      const fluxo = definirFluxoMonitoramentoRota(configuracao);
      let planejamento: PlanejamentoExecucaoRota | undefined;

      setMonitoringEnabledForFlow(fluxo.monitorar);
      setSelectedPlanning(undefined);

      if (fluxo.exibirPrevia) {
        const origem = currentLocation ?? await getLocation(true);
        const previa = origem
          ? await previaAssistida.loadPreview(
              origem,
              routes,
              currentLocationSnapshot,
            )
          : null;

        if (previa) {
          planejamento = {
            servidorDocumentId: null,
            trajetoPlanejado: previa.encodedPolyline,
            distanciaPlanejadaMetros: previa.distanceMeters,
            duracaoPlanejadaSegundos: previa.durationSeconds,
          };
          setSelectedPlanning(planejamento);
          const descricao = formatarEstimativaRotaAssistente(previa);
          estimativaTracadoRef.current = descricao;
        } else {
          feedbackTracadoRef.current?.(
            'Não consegui calcular a estimativa agora. Vou continuar com a abertura do navegador.',
          );
        }
      } else {
        feedbackTracadoRef.current?.(
          'A estimativa está desativada no momento. Vou abrir a rota no navegador.',
        );
      }

      const preferido = await obterNavegadorPreferido(userKey);
      const decisao = resolverNavegadorRota({
        quantidadeDestinos: routes.length,
        navegadorSolicitado: solicitacaoTracado.navegador,
        navegadorPreferido: preferido,
      });

      if (decisao.wazeSubstituidoPorGoogle) {
        feedbackTracadoRef.current?.(
          'Como esta rota possui várias paradas, vou usar o Google Maps para preservar a ordem completa.',
        );
      }

      if (!decisao.navegador) {
        feedbackTracadoRef.current?.(
          'Escolha Google Maps ou Waze. Vou lembrar sua preferência nas próximas rotas.',
        );

        if (execucaoAtiva) {
          // A rota ativa só pode ser substituída depois de uma confirmação
          // explícita. A escolha do navegador acontece na etapa seguinte.
          setReplaceActiveRoute(true);
          setInterruptionDialogMode('replace');
          return;
        }

        setNavigatorDialogVisible(true);
        return;
      }

      if (execucaoAtiva) {
        setNavegadorDiretoPendente(decisao.navegador);
        setInterruptionDialogMode('replace');
        return;
      }

      await startNavigation(decisao.navegador, {
        planejamento,
        monitorar: fluxo.monitorar,
      });
    } finally {
      setProcessandoFluxoAssistido(false);
    }
  }, [
    currentLocation,
    currentLocationSnapshot,
    execucaoAtiva,
    getLocation,
    hasRoutes,
    interfaceOcupada,
    previaAssistida,
    routes,
    solicitacaoTracado,
    userKey,
    verificarMonitoramento,
  ]);

  useEffect(() => {
    if (
      !solicitacaoTracado ||
      solicitacaoTratadaRef.current >= solicitacaoTracado.id ||
      !hasRoutes
    ) {
      return;
    }

    solicitacaoTratadaRef.current = solicitacaoTracado.id;

    if (solicitacaoTracado.modo === 'direto') {
      void handleTraceRouteDirectly();
    } else {
      void handleTraceRoute();
    }
  }, [
    handleTraceRoute,
    handleTraceRouteDirectly,
    hasRoutes,
    solicitacaoTracado,
  ]);

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

    if (navegadorDiretoPendente) {
      const navegador = navegadorDiretoPendente;
      setNavegadorDiretoPendente(null);
      void startNavigation(navegador, {
        substituirExecucaoAtiva: true,
      });
      return;
    }

    setReplaceActiveRoute(true);
    setNavigatorDialogVisible(true);
  };

  const handleCloseNavigatorDialog = (): void => {
    if (interfaceOcupada) return;

    setNavigatorDialogVisible(false);
    setReplaceActiveRoute(false);
    estimativaTracadoRef.current = null;
    feedbackTracadoRef.current = null;
  };

  const handleCloseInterruptionDialog = (): void => {
    if (processando) return;
    setInterruptionDialogMode(null);
    setNavegadorDiretoPendente(null);
    setReplaceActiveRoute(false);
    estimativaTracadoRef.current = null;
    feedbackTracadoRef.current = null;
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
        trailingAction={<RouteAssistantMic />}
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
            interfaceOcupada ||
            !hasRoutes
          }
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{
            disabled:
              interfaceOcupada ||
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
                !interfaceOcupada &&
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
            {processandoFluxoAssistido
              ? 'Preparando rota...'
              : processando
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
          onDismiss={handleCloseInterruptionDialog}
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
              onPress={handleCloseInterruptionDialog}
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
