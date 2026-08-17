import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Keyboard, Text, useWindowDimensions, View} from 'react-native';
import MapView, {
  Marker,
  type LatLng,
  type MapPressEvent,
  type MarkerPressEvent,
  type Region,
} from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Button,
  Dialog,
  FAB,
  Portal,
  Surface,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import {useMapLocation} from '../../../core/location/useLocation';
import {useAppTheme} from '../../../core/theme/appTheme';
import ClusterMarker from '../../../shared/components/maps/ClusterMarker';
import {appLogger} from '../../../shared/logging/appLogger';
import ConfirmacaoPermissaoRastreamentoDialog from '../../execucaoRota/components/ConfirmacaoPermissaoRastreamentoDialog';
import useNavegacaoMonitorada from '../../execucaoRota/hooks/useNavegacaoMonitorada';
import {definirFluxoMonitoramentoRota} from '../../execucaoRota/useCases/definirFluxoMonitoramentoRota';
import type {
  NavegadorRota,
  PlanejamentoExecucaoRota,
} from '../../execucaoRota/models/ExecucaoRota';
import type {Filial} from '../../filiais/models/Filial';
import NavigationAppDialog from '../../rotas/components/NavigationAppDialog';
import RoutePreviewModal from '../../rotas/components/RoutePreviewModal';
import usePrepararOrigemPreviaRota from '../../rotas/hooks/usePrepararOrigemPreviaRota';
import type {RoutePreview} from '../../rotas/models/RoutePreview';
import usePontos from '../hooks/usePontos';
import {usePontosContext} from '../PontosContext';
import {identificarCidadePonto} from '../useCases/identificarCidadePonto';
import type {
  CategoriaPonto,
  NovoPontoInput,
  PontoInteresse,
} from '../models/Ponto';
import {
  DEFAULT_REGION,
  getCoordinates,
} from '../../../shared/maps/coordinates';
import {
  areClusterRegionsClose,
  areRegionsClose,
  MapClusterIndex,
} from '../../../shared/maps/clustering';
import PontoForm from '../components/PontoForm';
import PontosNoMesmoLocalDialog from '../components/PontosNoMesmoLocalDialog';
import {
  agruparPontosPorLocal,
  type GrupoPontosPorLocal,
} from '../useCases/agruparPontosPorLocal';
import AddPointStyles from './pontosScreen.styles';

interface PontoMapa extends PontoInteresse {
  coordinate: LatLng;
  uniqueKey: string;
}

type LocalPontosMapa = GrupoPontosPorLocal<PontoMapa>;

const getLocalPontosCoordinate = (
  local: LocalPontosMapa,
): LatLng => local.coordinate;
const getLocalPontosKey = (
  local: LocalPontosMapa,
): string => local.uniqueKey;

const criarRotaPonto = (
  ponto: PontoInteresse | null,
  cidadeAtual: string | null,
): Filial[] =>
  ponto
    ? [{
        codigofilial: ponto.id ?? 0,
        nomefilial: ponto.descricao,
        nomecidade:
          ponto.cidadePonto ?? cidadeAtual ?? 'Não informado',
        latitude: ponto.latitude,
        longitude: ponto.longitude,
      }]
    : [];

export default function PontosScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {width, height} = useWindowDimensions();
  const mapRef = useRef<MapView | null>(null);

  const { pontos, loading, error, postPontos } = usePontos();
  const {
    solicitacaoNavegacao,
    consumirSolicitacaoNavegacao,
  } = usePontosContext();
  const {
    execucaoAtiva,
    processando,
    iniciarNavegacao,
    verificarMonitoramento,
    confirmacaoPermissaoVisivel,
    confirmarPermissaoRastreamento,
    cancelarPermissaoRastreamento,
  } = useNavegacaoMonitorada();
  const {
    currentLocation,
    currentLocationSnapshot,
    currentCity,
    mapRegion,
    openLocationSettings,
  } = useMapLocation();
  const initialRegionRef = useRef<Region>(
    mapRegion ?? DEFAULT_REGION,
  );
  const centeredOnLocationRef = useRef(Boolean(mapRegion));

  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<LatLng | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);
  const [
    locationDialogVisible,
    setLocationDialogVisible,
  ] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [navigationPoint, setNavigationPoint] =
    useState<PontoMapa | null>(null);
  const [pontosNoMesmoLocal, setPontosNoMesmoLocal] =
    useState<PontoMapa[]>([]);
  const [
    routePreviewVisible,
    setRoutePreviewVisible,
  ] = useState(false);
  const [
    navigatorDialogVisible,
    setNavigatorDialogVisible,
  ] = useState(false);
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
  const [visibleRegion, setVisibleRegion] =
    useState<Region>(initialRegionRef.current);

  const currentCoordinate = useMemo<LatLng | null>(() => {
    return currentLocation ? getCoordinates(currentLocation) : null;
  }, [currentLocation]);
  const previewPointRoute = useMemo<Filial[]>(
    () => criarRotaPonto(navigationPoint, currentCity),
    [currentCity, navigationPoint],
  );
  usePrepararOrigemPreviaRota(
    navigationPoint !== null,
    currentLocationSnapshot,
  );

  const pontosValidos = useMemo<PontoMapa[]>(() => {
    const pontosUnicos = new Map<string, PontoMapa>();

    (pontos as PontoInteresse[]).forEach(ponto => {
      const coordinate = getCoordinates(ponto);

      if (!coordinate) return;

      const uniqueKey =
        ponto.documentId ??
        String(ponto.id ?? `${coordinate.latitude}-${coordinate.longitude}-${ponto.descricao}`);

      if (!pontosUnicos.has(uniqueKey)) {
        pontosUnicos.set(uniqueKey, {
          ...ponto,
          coordinate,
          uniqueKey,
        });
      }
    });

    return Array.from(pontosUnicos.values());
  }, [pontos]);
  const locaisPontos = useMemo<LocalPontosMapa[]>(
    () => agruparPontosPorLocal(pontosValidos),
    [pontosValidos],
  );

  const handleMapReady = useCallback((): void => {
    setMapReady(true);
  }, []);

  const handleRegionChangeComplete = useCallback(
    (region: Region): void => {
      setVisibleRegion(current =>
        areClusterRegionsClose(current, region)
          ? current
          : region,
      );
    },
    [],
  );

  /*
   * Evita repetir a animação quando a localização já definiu
   * initialRegion, mas centraliza se ela chegar depois do mapa.
   */
  useEffect(() => {
    if (
      !mapReady ||
      !mapRegion ||
      centeredOnLocationRef.current
    ) {
      return;
    }

    centeredOnLocationRef.current = true;

    if (areRegionsClose(initialRegionRef.current, mapRegion)) {
      return;
    }

    mapRef.current?.animateToRegion(mapRegion, 400);
  }, [mapReady, mapRegion]);

  /*
   * O índice é recriado somente quando os pontos válidos mudam. Alterações de
   * câmera reutilizam a mesma estrutura espacial do Supercluster.
   */
  const clusterIndex = useMemo(
    () =>
      new MapClusterIndex({
        items: locaisPontos,
        getCoordinate: getLocalPontosCoordinate,
        getKey: getLocalPontosKey,
      }),
    [locaisPontos],
  );

  /*
   * Consulta o índice pela região e zoom atuais, mantendo sob controle a
   * quantidade de markers renderizados.
   */
  const clusters = useMemo(
    () => mapReady
      ? clusterIndex.getClusters({
          region: visibleRegion,
          viewportWidth: width,
          viewportHeight: height,
        })
      : [],
    [
      clusterIndex,
      height,
      mapReady,
      visibleRegion,
      width,
    ],
  );

  /*
   * Usa o zoom de expansão calculado pelo Supercluster para revelar os pontos
   * do agrupamento progressivamente.
   */
  const focusCluster = useCallback(
    (clusterId: number, coordinate: LatLng): void => {
      setNavigationPoint(null);
      mapRef.current?.animateCamera(
        {
          center: coordinate,
          zoom:
            clusterIndex.getClusterExpansionZoom(
              clusterId,
            ),
        },
        {duration: 350},
      );
    },
    [clusterIndex],
  );

  const selectNavigationPoint = useCallback(
    (point: PontoMapa): void => {
      if (isAddMode) return;

      setNavigationPoint(point);
    },
    [isAddMode],
  );

  const selectPointLocation = useCallback(
    (local: LocalPontosMapa): void => {
      if (isAddMode) return;

      if (local.pontos.length === 1) {
        selectNavigationPoint(local.pontos[0]);
        return;
      }

      setNavigationPoint(null);
      setPontosNoMesmoLocal(local.pontos);
    },
    [isAddMode, selectNavigationPoint],
  );

  const pointMarkers = useMemo(
    () =>
      clusters.map(cluster => {
        if (cluster.item) {
          const local = cluster.item;
          const point = local.pontos[0];

          if (local.pontos.length > 1) {
            return (
              <ClusterMarker
                key={cluster.id}
                coordinate={local.coordinate}
                count={local.pontos.length}
                backgroundColor={theme.colors.info}
                textColor={theme.colors.onPrimary}
                onPress={() => selectPointLocation(local)}
              />
            );
          }

          return (
            <Marker
              key={cluster.id}
              coordinate={point.coordinate}
              title={point.descricao}
              description={point.categoria}
              pinColor={
                point.categoria === 'Restaurante'
                  ? theme.colors.primary
                  : theme.colors.success
              }
              tracksViewChanges={false}
              onPress={(
                event: MarkerPressEvent,
              ) => {
                event.stopPropagation();
                selectPointLocation(local);
              }}
            />
          );
        }

        return (
          <ClusterMarker
            key={cluster.id}
            coordinate={cluster.coordinate}
            count={cluster.count}
            backgroundColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            onPress={() => {
              if (cluster.clusterId === null) return;

              focusCluster(
                cluster.clusterId,
                cluster.coordinate,
              );
            }}
          />
        );
      }),
    [
      clusters,
      focusCluster,
      selectPointLocation,
      theme.colors.info,
      theme.colors.onPrimary,
      theme.colors.primary,
      theme.colors.success,
    ],
  );

  useEffect(() => {
    if (!error) return;

    Toast.show({
      type: 'error',
      text1: 'Não foi possível carregar os pontos',
      text2: 'Verifique sua conexão e tente novamente.',
      position: 'top',
    });
  }, [error]);

  const resetAddPoint = (): void => {
    Keyboard.dismiss();
    setIsAddMode(false);
    setSelectedPoint(null);
    setDescription('');
    setCategoryDialogVisible(false);
    setPontosNoMesmoLocal([]);
  };

  const handleMapPress = (event: MapPressEvent): void => {
    if (!isAddMode) {
      setNavigationPoint(null);
      setPontosNoMesmoLocal([]);
      return;
    }

    Keyboard.dismiss();
    setSelectedPoint(event.nativeEvent.coordinate);
  };

  const handleCurrentLocation = (): void => {
    Keyboard.dismiss();

    if (!currentCoordinate) {
      setLocationDialogVisible(true);
      return;
    }

    setSelectedPoint(currentCoordinate);

    mapRef.current?.animateToRegion(
      {
        latitude: currentCoordinate.latitude,
        longitude: currentCoordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      700,
    );
  };

  const handleRequestSave = (): void => {
    if (!selectedPoint) {
      Toast.show({
        type: 'info',
        text1: 'Selecione um local',
        text2: 'Toque no mapa ou utilize sua localização atual.',
        position: 'top',
      });

      return;
    }

    if (!description.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Informe uma descrição',
        text2: 'Digite uma descrição para identificar o ponto.',
        position: 'top',
      });

      return;
    }

    Keyboard.dismiss();
    setCategoryDialogVisible(true);
  };

  const savePoint = async (categoria: CategoriaPonto): Promise<void> => {
    if (!selectedPoint || saving) return;

    Keyboard.dismiss();
    setCategoryDialogVisible(false);
    setSaving(true);

    try {
      const cidadePonto =
        await identificarCidadePonto(selectedPoint);
      const novoPonto: NovoPontoInput = {
        latitude: selectedPoint.latitude.toString(),
        longitude: selectedPoint.longitude.toString(),
        descricao: description.trim(),
        categoria,
        cidadePonto: cidadePonto ?? 'Não informado',
      };

      await postPontos(novoPonto);

      Toast.show({
        type: 'success',
        text1: 'Ponto salvo com sucesso',
        text2: categoria,
        position: 'top',
      });

      resetAddPoint();
    } catch (requestError: unknown) {
      appLogger.error('Erro ao salvar ponto:', requestError);

      Toast.show({
        type: 'error',
        text1: 'Não foi possível salvar o ponto',
        text2: 'Verifique sua conexão e tente novamente.',
        position: 'top',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPointRoute = async (
    navegador: NavegadorRota,
  ): Promise<void> => {
    if (
      !navigationPoint ||
      previewPointRoute.length === 0 ||
      processando ||
      execucaoAtiva
    ) {
      return;
    }

    await iniciarNavegacao({
      rotas: previewPointRoute,
      navegador,
      tipoDestino:
        navigationPoint.categoria ===
        'Restaurante'
          ? 'restaurante'
          : 'posto_combustivel',
      monitorar: monitoringEnabledForFlow,
      planejamento: selectedPlanning,
    });
  };

  /**
   * Só solicita a prévia quando o registro estiver habilitado. No modo
   * externo, segue diretamente para a escolha entre Maps e Waze.
   */
  const handleTracePointRoute = useCallback(
    async (ponto: PontoInteresse | null = navigationPoint): Promise<void> => {
      const rotaSolicitada = criarRotaPonto(ponto, currentCity);

      if (
        rotaSolicitada.length === 0 ||
        processando ||
        execucaoAtiva
      ) {
        return;
      }

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
    },
    [
      currentCity,
      execucaoAtiva,
      navigationPoint,
      processando,
      verificarMonitoramento,
    ],
  );

  useEffect(() => {
    if (!solicitacaoNavegacao) return;

    const pontoSolicitado = pontosValidos.find(ponto => {
      const solicitado = solicitacaoNavegacao.ponto;

      if (solicitado.documentId && ponto.documentId) {
        return solicitado.documentId === ponto.documentId;
      }

      return solicitado.id !== undefined && solicitado.id === ponto.id;
    });

    consumirSolicitacaoNavegacao(solicitacaoNavegacao.id);

    if (!pontoSolicitado) return;

    setNavigationPoint(pontoSolicitado);
    setPontosNoMesmoLocal([]);
    mapRef.current?.animateToRegion(
      {
        ...pontoSolicitado.coordinate,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      450,
    );

    if (solicitacaoNavegacao.iniciarFluxo) {
      void handleTracePointRoute(pontoSolicitado);
    }
  }, [
    consumirSolicitacaoNavegacao,
    handleTracePointRoute,
    pontosValidos,
    solicitacaoNavegacao,
  ]);

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

  return (
    <View style={[AddPointStyles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        ref={mapRef}
        initialRegion={initialRegionRef.current}
        customMapStyle={theme.custom.mapStyle}
        loadingEnabled
        showsUserLocation={Boolean(currentCoordinate)}
        showsMyLocationButton={Boolean(currentCoordinate)}
        zoomEnabled
        zoomControlEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        style={AddPointStyles.map}
        onPress={handleMapPress}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {pointMarkers}

        {selectedPoint && isAddMode && (
          <Marker
            coordinate={selectedPoint}
            title="Novo ponto"
            description="Arraste para ajustar"
            pinColor={theme.colors.info}
            draggable
            tracksViewChanges={false}
            onDragEnd={event => setSelectedPoint(event.nativeEvent.coordinate)}
          />
        )}
      </MapView>

      <Surface
        elevation={2}
        style={[AddPointStyles.legend, { backgroundColor: theme.colors.surface }]}
      >
        <View style={AddPointStyles.legendItem}>
          <MaterialIcons name="fastfood" size={18} color={theme.colors.primary} />

          <Text style={[AddPointStyles.legendText, { color: theme.colors.onSurface }]}>
            Restaurante
          </Text>
        </View>

        <View
          style={[
            AddPointStyles.legendDivider,
            { backgroundColor: theme.colors.outline },
          ]}
        />

        <View style={AddPointStyles.legendItem}>
          <MaterialIcons
            name="local-gas-station"
            size={18}
            color={theme.colors.success}
          />

          <Text style={[AddPointStyles.legendText, { color: theme.colors.onSurface }]}>
            Posto
          </Text>
        </View>
      </Surface>

      {loading && (
        <View pointerEvents="none" style={AddPointStyles.loading}>
          <Surface
            elevation={3}
            style={[
              AddPointStyles.loadingCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />

            <Text style={[AddPointStyles.loadingText, { color: theme.colors.onSurface }]}>
              Carregando pontos...
            </Text>
          </Surface>
        </View>
      )}

      {!isAddMode && (
        <FAB
          icon="map-marker-plus"
          label="Adicionar ponto"
          color={theme.colors.actionForeground}
          accessibilityLabel="Adicionar ponto"
          style={[
            AddPointStyles.addButton,
            { backgroundColor: theme.colors.actionBackground },
          ]}
          onPress={() => {
            setNavigationPoint(null);
            setPontosNoMesmoLocal([]);
            setRoutePreviewVisible(false);
            setIsAddMode(true);
          }}
        />
      )}

      {!isAddMode && navigationPoint && (
        <FAB
          icon="directions"
          label="Traçar rota"
          loading={processando}
          disabled={
            processando ||
            Boolean(execucaoAtiva)
          }
          color={theme.colors.actionForeground}
          accessibilityLabel={`Traçar rota até ${navigationPoint.descricao}`}
          style={[
            AddPointStyles.routeButton,
            {
              backgroundColor:
                theme.colors.actionBackground,
            },
          ]}
          onPress={() => {
            void handleTracePointRoute();
          }}
        />
      )}

      {isAddMode && (
        <PontoForm
          selectedPoint={selectedPoint}
          description={description}
          saving={saving}
          categoryDialogVisible={categoryDialogVisible}
          onDescriptionChange={setDescription}
          onClose={resetAddPoint}
          onCurrentLocation={handleCurrentLocation}
          onRequestSave={handleRequestSave}
          onCloseCategory={() => setCategoryDialogVisible(false)}
          onSaveCategory={savePoint}
        />
      )}

      <PontosNoMesmoLocalDialog
        visible={pontosNoMesmoLocal.length > 1}
        pontos={pontosNoMesmoLocal}
        onDismiss={() => setPontosNoMesmoLocal([])}
        onSelect={ponto => {
          setPontosNoMesmoLocal([]);
          selectNavigationPoint(ponto);
        }}
      />

      <RoutePreviewModal
        visible={routePreviewVisible}
        origin={currentCoordinate}
        originSnapshot={currentLocationSnapshot}
        routes={previewPointRoute}
        starting={processando}
        onClose={() =>
          setRoutePreviewVisible(false)
        }
        onStart={handleStartPreviewedRoute}
        onStartWithoutPreview={handleStartWithoutPreview}
        onRequestLocation={() => {
          void openLocationSettings();
        }}
      />

      <Portal>
        <Dialog
          visible={locationDialogVisible}
          onDismiss={() =>
            setLocationDialogVisible(false)
          }
          style={{
            backgroundColor: theme.colors.surface,
          }}
        >
          <Dialog.Title>
            Localização necessária
          </Dialog.Title>

          <Dialog.Content>
            <Text
              style={{
                color:
                  theme.colors.onSurfaceVariant,
              }}
            >
              Ative a localização e permita o acesso
              nas configurações do aplicativo.
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button
              onPress={() =>
                setLocationDialogVisible(false)
              }
            >
              Agora não
            </Button>

            <Button
              mode="contained"
              onPress={() => {
                setLocationDialogVisible(false);
                void openLocationSettings();
              }}
            >
              Abrir configurações
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <NavigationAppDialog
        visible={navigatorDialogVisible}
        processing={processando}
        monitoringEnabled={
          monitoringEnabledForFlow
        }
        onDismiss={() =>
          setNavigatorDialogVisible(false)
        }
        onSelect={navigator => {
          setNavigatorDialogVisible(false);
          void handleOpenPointRoute(navigator);
        }}
      />

      <ConfirmacaoPermissaoRastreamentoDialog
        visible={confirmacaoPermissaoVisivel}
        onConfirm={confirmarPermissaoRastreamento}
        onDismiss={cancelarPermissaoRastreamento}
      />
    </View>
  );
}
