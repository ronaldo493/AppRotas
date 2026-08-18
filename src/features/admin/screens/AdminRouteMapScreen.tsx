import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import useAdminRouteMap from '../hooks/useAdminRouteMap';
import styles from '../styles/adminRouteMap.styles';
import {formatarSituacaoAdmin} from '../useCases/formatAdminRouteDashboard';
import {prepararAdminRouteMap} from '../useCases/prepareAdminRouteMap';
import {formatarIdadeLocalizacao} from '../useCases/formatAdminCollaboratorMap';

interface Props {
  codigoSessao: string | null;
  nomeColaborador: string | null;
  onClose: () => void;
}

/** Mapa histórico carregado apenas quando o gestor solicita uma execução. */
export default function AdminRouteMapScreen({
  codigoSessao,
  nomeColaborador,
  onClose,
}: Props): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const fittedSessionRef = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const {data, loading, refreshing, error, retry} = useAdminRouteMap(codigoSessao);
  const preparado = useMemo(
    () => data ? prepararAdminRouteMap(data) : null,
    [data],
  );

  useEffect(() => {
    setMapReady(false);
    fittedSessionRef.current = null;
  }, [codigoSessao]);

  useEffect(() => {
    if (
      !mapReady || !preparado || preparado.enquadramento.length === 0 ||
      fittedSessionRef.current === codigoSessao
    ) return;
    fittedSessionRef.current = codigoSessao;

    if (preparado.enquadramento.length === 1) {
      mapRef.current?.animateToRegion({
        ...preparado.enquadramento[0],
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 350);
      return;
    }

    mapRef.current?.fitToCoordinates(preparado.enquadramento, {
      animated: true,
      edgePadding: {top: 44, right: 44, bottom: 44, left: 44},
    });
  }, [mapReady, preparado]);

  const ultimaPosicao = preparado?.trajetoReal[
    (preparado?.trajetoReal.length ?? 0) - 1
  ];
  const emAndamento = data?.situacaoExecucao === 'em_andamento';

  const coordenadaInicial = data?.origem
    ?? preparado?.trajetoReal[0]
    ?? preparado?.trajetoPlanejado[0]
    ?? preparado?.destinos[0]
    ?? {latitude: -22.72, longitude: -47.64};

  return (
    <Modal
      visible={codigoSessao !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={['top']}
        style={[styles.container, {backgroundColor: theme.colors.background}]}
      >
        <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
          <View style={styles.headerContent}>
            <Text numberOfLines={1} style={[styles.title, {color: theme.colors.onBackground}]}>
              {emAndamento ? 'Acompanhamento do trajeto' : 'Trajeto realizado'}
            </Text>
            <Text numberOfLines={1} style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
              {data?.username || nomeColaborador || 'Carregando percurso...'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Fechar mapa do trajeto"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={[styles.closeButtonText, {color: theme.colors.primary}]}>
              Fechar
            </Text>
          </TouchableOpacity>
        </View>

        {loading && !data && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
              Carregando trajeto...
            </Text>
          </View>
        )}

        {error && !data && (
          <View style={styles.centered}>
            <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>
              Não foi possível abrir o mapa
            </Text>
            <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
              {error}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void retry()}
              style={[styles.retryButton, {backgroundColor: theme.colors.actionBackground}]}
            >
              <Text style={[styles.retryButtonText, {color: theme.colors.actionForeground}]}>
                Tentar novamente
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {data && preparado && (
          <>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: coordenadaInicial.latitude,
                longitude: coordenadaInicial.longitude,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              customMapStyle={theme.custom.mapStyle}
              loadingEnabled
              toolbarEnabled={false}
              moveOnMarkerPress={false}
              onMapReady={() => setMapReady(true)}
            >
              {preparado.trajetoPlanejado.length > 1 && (
                <Polyline
                  coordinates={preparado.trajetoPlanejado}
                  strokeColor={theme.colors.onSurfaceVariant}
                  strokeWidth={3}
                  lineDashPattern={[8, 6]}
                  lineCap="round"
                  lineJoin="round"
                />
              )}

              {preparado.trajetoReal.length > 1 && (
                <Polyline
                  coordinates={preparado.trajetoReal}
                  strokeColor={theme.colors.primary}
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}

              {data.origem && (
                <Marker
                  coordinate={data.origem}
                  title="Origem"
                  description={data.origem.cidade ?? undefined}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        backgroundColor: theme.colors.actionBackground,
                        borderColor: theme.colors.actionForeground,
                      },
                    ]}
                  >
                    <Text style={[styles.markerText, {color: theme.colors.actionForeground}]}>
                      I
                    </Text>
                  </View>
                </Marker>
              )}

              {preparado.destinos.map((destino, index) => (
                <Marker
                  key={`${destino.codigo ?? 'destino'}-${destino.ordem ?? index}`}
                  coordinate={{latitude: destino.latitude, longitude: destino.longitude}}
                  title={destino.nome || `Destino ${index + 1}`}
                  description={destino.cidade || undefined}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        backgroundColor: destino.visitado
                          ? theme.colors.success
                          : theme.colors.primary,
                        borderColor: theme.colors.onPrimary,
                      },
                    ]}
                  >
                    <Text style={[styles.markerText, {color: theme.colors.onPrimary}]}>
                      {destino.ordem ?? index + 1}
                    </Text>
                  </View>
                </Marker>
              ))}

              {ultimaPosicao && emAndamento && (
                <Marker
                  coordinate={ultimaPosicao}
                  title="Última posição recebida"
                  description={data.ultimaLocalizacaoEm
                    ? formatarIdadeLocalizacao(data.ultimaLocalizacaoEm)
                    : 'Horário indisponível'}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        backgroundColor: theme.colors.success,
                        borderColor: theme.colors.onPrimary,
                      },
                    ]}
                  >
                    <Text style={[styles.markerText, {color: theme.colors.onPrimary}]}>●</Text>
                  </View>
                </Marker>
              )}
            </MapView>

            <View
              style={[
                styles.footer,
                {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.outline,
                  paddingBottom: Math.max(insets.bottom, 12),
                },
              ]}
            >
              <Text style={[styles.footerTitle, {color: theme.colors.onSurface}]}>
                {formatarSituacaoAdmin(data.situacaoExecucao)}
                {refreshing ? ' · atualizando' : ''}
              </Text>
              <Text style={[styles.footerMeta, {color: theme.colors.onSurfaceVariant}]}>
                {data.setor || 'Setor não informado'} · {data.quantidadePontos} leituras
                {data.ultimaLocalizacaoEm
                  ? ` · ${formatarIdadeLocalizacao(data.ultimaLocalizacaoEm)}`
                  : ''}
              </Text>

              {preparado.trajetoReal.length <= 1 && (
                <Text style={[styles.notice, {color: theme.colors.warning}]}>
                  {emAndamento
                    ? 'Aguardando os primeiros pontos da rota serem sincronizados.'
                    : 'O trajeto realizado não está disponível. O mapa mostra apenas o planejamento e os destinos sincronizados.'}
                </Text>
              )}

              <View style={styles.legend}>
                {preparado.trajetoReal.length > 1 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendLine, {backgroundColor: theme.colors.primary}]} />
                    <Text style={[styles.legendLabel, {color: theme.colors.onSurfaceVariant}]}>
                      Realizado
                    </Text>
                  </View>
                )}
                {preparado.trajetoPlanejado.length > 1 && (
                  <View style={styles.legendItem}>
                    <View style={[styles.legendLine, {backgroundColor: theme.colors.onSurfaceVariant}]} />
                    <Text style={[styles.legendLabel, {color: theme.colors.onSurfaceVariant}]}>
                      Planejado
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
