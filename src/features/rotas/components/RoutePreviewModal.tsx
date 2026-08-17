import {MaterialIcons} from '@expo/vector-icons';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Text,
  View,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type LatLng,
} from 'react-native-maps';
import {
  ActivityIndicator,
  Button,
  IconButton,
} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {CapturedLocation} from '../../../core/location/models/LocationSnapshot';
import {useAppTheme} from '../../../core/theme/appTheme';
import type {Filial} from '../../filiais/models/Filial';
import {getCoordinates} from '../../../shared/maps/coordinates';
import type {RoutePreview} from '../models/RoutePreview';
import useRoutePreview from '../hooks/useRoutePreview';
import styles from './routePreviewModal.styles';

interface RoutePreviewModalProps {
  visible: boolean;
  origin: LatLng | null;
  originSnapshot?: CapturedLocation | null;
  routes: readonly Filial[];
  starting?: boolean;
  onClose: () => void;
  onStart: (preview: RoutePreview) => void;
  onStartWithoutPreview?: () => void;
  onRequestLocation?: () => void;
}

const MAP_EDGE_PADDING = {
  top: 52,
  right: 42,
  bottom: 52,
  left: 42,
};

/**
 * Exibe o planejamento dentro do aplicativo. Abrir esta tela é uma operação
 * somente de consulta; a execução começa exclusivamente pelo botão de início.
 */
export default function RoutePreviewModal({
  visible,
  origin,
  originSnapshot,
  routes,
  starting = false,
  onClose,
  onStart,
  onStartWithoutPreview,
  onRequestLocation,
}: RoutePreviewModalProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const {
    preview,
    previewOrigin,
    loading,
    error,
    loadPreview,
    resetPreview,
  } = useRoutePreview();
  const destinationCoordinates = useMemo(
    () =>
      routes.flatMap(route => {
        const coordinate = getCoordinates(route);
        return coordinate ? [coordinate] : [];
      }),
    [routes],
  );
  const displayedOrigin = previewOrigin ?? origin;
  const allCoordinates = useMemo(
    () =>
      displayedOrigin
        ? [displayedOrigin, ...destinationCoordinates]
        : destinationCoordinates,
    [destinationCoordinates, displayedOrigin],
  );

  useEffect(() => {
    if (!visible) {
      resetPreview();
      setMapReady(false);
      return;
    }

    if (!origin) return;

    void loadPreview(
      origin,
      routes,
      originSnapshot,
    );
  }, [
    loadPreview,
    origin,
    originSnapshot,
    resetPreview,
    routes,
    visible,
  ]);

  useEffect(() => {
    if (
      !visible ||
      !mapReady ||
      !preview ||
      allCoordinates.length < 2
    ) {
      return;
    }

    mapRef.current?.fitToCoordinates(
      allCoordinates,
      {
        edgePadding: MAP_EDGE_PADDING,
        animated: false,
      },
    );
  }, [
    allCoordinates,
    mapReady,
    preview,
    visible,
  ]);

  const retry = (): void => {
    if (!origin) {
      onRequestLocation?.();
      return;
    }

    void loadPreview(
      origin,
      routes,
      originSnapshot,
    );
  };
  const close = (): void => {
    if (!starting) onClose();
  };
  const start = (): void => {
    if (!preview || starting) return;

    onStart(preview);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            backgroundColor:
              theme.colors.background,
          },
        ]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outline,
            },
          ]}
        >
          <IconButton
            icon="arrow-left"
            disabled={starting}
            accessibilityLabel="Fechar prévia da rota"
            iconColor={theme.colors.onSurface}
            onPress={close}
          />

          <Text
            numberOfLines={1}
            style={[
              styles.headerTitle,
              {color: theme.colors.onSurface},
            ]}
          >
            Prévia da rota
          </Text>
        </View>

        {loading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />

            <Text
              style={[
                styles.stateTitle,
                {color: theme.colors.onBackground},
              ]}
            >
              Calculando a melhor rota
            </Text>

            <Text
              style={[
                styles.stateDescription,
                {
                  color:
                    theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Este cálculo é apenas uma consulta e ainda não inicia o percurso.
            </Text>
          </View>
        )}

        {!loading && (!displayedOrigin || error) && (
          <View style={styles.stateContainer}>
            <MaterialIcons
              name={
                displayedOrigin
                  ? 'route'
                  : 'location-off'
              }
              size={42}
              color={theme.colors.iconDefault}
            />

            <Text
              style={[
                styles.stateTitle,
                {color: theme.colors.onBackground},
              ]}
            >
              Não foi possível exibir a rota
            </Text>

            <Text
              style={[
                styles.stateDescription,
                {
                  color:
                    theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {displayedOrigin
                ? error
                : 'Precisamos da sua localização atual para calcular o trajeto.'}
            </Text>

            <Button
              mode="outlined"
              style={styles.retryButton}
              onPress={retry}
            >
              {displayedOrigin
                ? 'Tentar novamente'
                : 'Abrir configurações'}
            </Button>

            {displayedOrigin && error && onStartWithoutPreview && (
              <Button
                mode="contained"
                style={styles.retryButton}
                disabled={starting}
                onPress={onStartWithoutPreview}
              >
                Continuar sem prévia
              </Button>
            )}
          </View>
        )}

        {!loading && displayedOrigin && preview && (
          <>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                ...displayedOrigin,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              customMapStyle={theme.custom.mapStyle}
              loadingEnabled
              showsUserLocation
              showsMyLocationButton
              toolbarEnabled={false}
              moveOnMarkerPress={false}
              onMapReady={() => setMapReady(true)}
            >
              <Polyline
                coordinates={preview.coordinates}
                strokeColor={theme.colors.primary}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />

              {destinationCoordinates.map(
                (coordinate, index) => (
                  <Marker
                    key={`${routes[index]?.codigofilial ?? index}-${index}`}
                    coordinate={coordinate}
                    title={
                      routes[index]?.nomefilial ??
                      `Destino ${index + 1}`
                    }
                    description={
                      routes[index]?.nomecidade
                    }
                  >
                    <View
                      style={[
                        styles.marker,
                        {
                          backgroundColor:
                            theme.colors.primary,
                          borderColor:
                            theme.colors.onPrimary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.markerText,
                          {
                            color:
                              theme.colors.onPrimary,
                          },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                  </Marker>
                ),
              )}
            </MapView>

            <View
              style={[
                styles.summary,
                {
                  paddingBottom:
                    Math.max(insets.bottom, 14),
                  backgroundColor:
                    theme.colors.surface,
                  borderTopColor:
                    theme.colors.outline,
                },
              ]}
            >
              <View style={styles.metrics}>
                <View
                  style={[
                    styles.metric,
                    {
                      backgroundColor:
                        theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="schedule"
                    size={23}
                    color={theme.colors.primary}
                  />

                  <View style={styles.metricContent}>
                    <Text
                      style={[
                        styles.metricLabel,
                        {
                          color:
                            theme.colors
                              .onSurfaceVariant,
                        },
                      ]}
                    >
                      Tempo estimado
                    </Text>

                    <Text
                      style={[
                        styles.metricValue,
                        {
                          color:
                            theme.colors.onSurface,
                        },
                      ]}
                    >
                      {preview.durationText}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.metric,
                    {
                      backgroundColor:
                        theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="route"
                    size={23}
                    color={theme.colors.primary}
                  />

                  <View style={styles.metricContent}>
                    <Text
                      style={[
                        styles.metricLabel,
                        {
                          color:
                            theme.colors
                              .onSurfaceVariant,
                        },
                      ]}
                    >
                      Distância
                    </Text>

                    <Text
                      style={[
                        styles.metricValue,
                        {
                          color:
                            theme.colors.onSurface,
                        },
                      ]}
                    >
                      {preview.distanceText}
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={[
                  styles.destinationSummary,
                  {
                    color:
                      theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {routes.length === 1
                  ? '1 destino na rota'
                  : `${routes.length} destinos na ordem selecionada`}
              </Text>

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  disabled={starting}
                  style={styles.actionButton}
                  onPress={close}
                >
                  Voltar
                </Button>

                <Button
                  mode="contained"
                  loading={starting}
                  disabled={starting}
                  buttonColor={
                    theme.colors.actionBackground
                  }
                  textColor={
                    theme.colors.actionForeground
                  }
                  style={styles.actionButton}
                  onPress={start}
                >
                  Iniciar percurso
                </Button>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
