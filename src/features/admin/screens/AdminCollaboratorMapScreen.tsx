import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE, type Region} from 'react-native-maps';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import {MapClusterIndex} from '../../../shared/maps/clustering';
import AdminModuleHeader from '../components/AdminModuleHeader';
import useAdminCollaboratorMap from '../hooks/useAdminCollaboratorMap';
import type {AdminCollaboratorLocation} from '../models/AdminCollaboratorMap';
import styles from '../styles/adminCollaboratorMap.styles';
import {
  descreverLocalizacaoColaborador,
  formatarIdadeLocalizacao,
  obterIniciaisColaborador,
} from '../useCases/formatAdminCollaboratorMap';

const INITIAL_REGION: Region = {
  latitude: -22.72,
  longitude: -47.64,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

/** Exibe a última posição conhecida; não representa presença online. */
export default function AdminCollaboratorMapScreen({
  onBack,
}: {
  onBack: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [viewport, setViewport] = useState({width: 0, height: 0});
  const [grupoSelecionado, setGrupoSelecionado] = useState<AdminCollaboratorLocation[]>([]);
  const painel = useAdminCollaboratorMap(true);
  const colaboradores = painel.data?.colaboradores ?? [];
  const scope = painel.data?.escopo.abrangencia === 'todos_setores'
    ? 'Todos os setores'
    : painel.data?.escopo.setor ?? 'Seu setor';

  const clusterIndex = useMemo(
    () => new MapClusterIndex<AdminCollaboratorLocation>({
      items: colaboradores,
      getCoordinate: item => ({latitude: item.latitude, longitude: item.longitude}),
      getKey: item => String(item.usuarioId),
      radius: 18,
      maxZoom: 22,
    }),
    [colaboradores],
  );
  // Posições de colaboradores são sempre individuais: não há agrupamento neste mapa.
  const clusters = useMemo(
    () => colaboradores.map(item => ({
      id: `colaborador:${item.usuarioId}`,
      coordinate: {latitude: item.latitude, longitude: item.longitude},
      count: 1,
      item,
      clusterId: null,
    })),
    [colaboradores],
  );

  useEffect(() => {
    if (!mapReady || fittedRef.current || colaboradores.length === 0) return;
    fittedRef.current = true;
    const coordinates = colaboradores.map(item => ({
      latitude: item.latitude,
      longitude: item.longitude,
    }));
    if (coordinates.length === 1) {
      mapRef.current?.animateToRegion({...coordinates[0], latitudeDelta: 0.04, longitudeDelta: 0.04}, 300);
      return;
    }
    mapRef.current?.fitToCoordinates(coordinates, {
      animated: true,
      edgePadding: {top: 54, right: 42, bottom: 54, left: 42},
    });
  }, [colaboradores, mapReady]);

  const onMapLayout = (event: LayoutChangeEvent): void => {
    setViewport(event.nativeEvent.layout);
  };
  const corEstado = (item: AdminCollaboratorLocation): string => {
    if (item.estado === 'atual') return theme.colors.success;
    if (item.estado === 'recente') return theme.colors.warning;
    return theme.colors.iconDefault;
  };

  if (painel.loading && !painel.data) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
          <AdminModuleHeader title="Mapa de colaboradores" onBack={onBack} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>Carregando posições...</Text>
        </View>
      </View>
    );
  }

  if (painel.error && !painel.data) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
          <AdminModuleHeader title="Mapa de colaboradores" onBack={onBack} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>Não foi possível abrir o mapa</Text>
          <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>{painel.error}</Text>
          <TouchableOpacity onPress={() => void painel.retry()} style={[styles.retryButton, {backgroundColor: theme.colors.actionBackground}]}>
            <Text style={[styles.retryText, {color: theme.colors.actionForeground}]}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
        <AdminModuleHeader title="Mapa de colaboradores" scope={scope} onBack={onBack} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, {color: theme.colors.onSurface}]}>
            {colaboradores.length} {colaboradores.length === 1 ? 'posição nas últimas 1 hora' : 'posições nas últimas 1 hora'}
          </Text>
          <Text style={[styles.updateText, {color: theme.colors.onSurfaceVariant}]}>
            {painel.refreshing ? 'Atualizando...' : 'Atualiza automaticamente'}
          </Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: theme.colors.success}]} /><Text style={[styles.legendText, {color: theme.colors.onSurfaceVariant}]}>Até 2 min</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: theme.colors.warning}]} /><Text style={[styles.legendText, {color: theme.colors.onSurfaceVariant}]}>2 a 15 min</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, {backgroundColor: theme.colors.iconDefault}]} /><Text style={[styles.legendText, {color: theme.colors.onSurfaceVariant}]}>15 a 60 min</Text></View>
        </View>
        {painel.error ? <Text style={[styles.inlineError, {color: theme.colors.primary}]}>{painel.error}</Text> : null}
      </View>

      <View style={{flex: 1}} onLayout={onMapLayout}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          customMapStyle={theme.custom.mapStyle}
          loadingEnabled
          toolbarEnabled={false}
          moveOnMarkerPress={false}
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={setRegion}
        >
          {clusters.map(cluster => {
            if (!cluster.item) {
              return (
                <Marker
                  key={cluster.id}
                  coordinate={cluster.coordinate}
                  onPress={() => {
                    if (cluster.clusterId === null) return;
                    setGrupoSelecionado(clusterIndex.getClusterItems(cluster.clusterId));
                  }}
                >
                  <View style={[styles.cluster, {backgroundColor: theme.colors.surface, borderColor: theme.colors.primary}]}>
                    <Text style={[styles.clusterText, {color: theme.colors.primary}]}>{cluster.count}</Text>
                  </View>
                </Marker>
              );
            }
            const item = cluster.item;
            return (
              <Marker
                key={`${cluster.id}:${item.estado}`}
                coordinate={cluster.coordinate}
                title={item.username}
                description={`${item.setor || 'Setor não informado'} · ${formatarIdadeLocalizacao(item.capturadaEm)}`}
              >
                <View style={[styles.marker, {backgroundColor: corEstado(item), borderColor: theme.colors.onPrimary}]}>
                  <Text style={[styles.markerText, {color: theme.colors.onPrimary}]}>{obterIniciaisColaborador(item.username)}</Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
        {colaboradores.length === 0 ? (
          <View style={[styles.emptyOverlay, {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline}]}>
            <Text style={[styles.emptyTitle, {color: theme.colors.onSurface}]}>Nenhuma posição recente</Text>
            <Text style={[styles.emptyText, {color: theme.colors.onSurfaceVariant}]}>Os marcadores aparecem quando o aplicativo de um colaborador envia uma localização válida nos últimos 60 minutos.</Text>
          </View>
        ) : null}
      </View>

      <Modal transparent animationType="slide" visible={grupoSelecionado.length > 0} onRequestClose={() => setGrupoSelecionado([])}>
        <View style={styles.modal}>
          <Pressable style={styles.backdrop} onPress={() => setGrupoSelecionado([])} />
          <View style={[styles.sheet, {backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 12)}]}>
            <View style={[styles.handle, {backgroundColor: theme.colors.outline}]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, {color: theme.colors.onSurface}]}>{grupoSelecionado.length} colaboradores neste ponto</Text>
              <Text style={[styles.sheetSubtitle, {color: theme.colors.onSurfaceVariant}]}>Toque fora para fechar.</Text>
            </View>
            <FlatList
              data={grupoSelecionado}
              keyExtractor={item => String(item.usuarioId)}
              renderItem={({item}) => (
                <View style={[styles.groupItem, {borderTopColor: theme.colors.outline}]}>
                  <Text style={[styles.groupName, {color: theme.colors.onSurface}]}>{item.username}</Text>
                  <Text style={[styles.groupDetails, {color: theme.colors.onSurfaceVariant}]}>{descreverLocalizacaoColaborador(item)}</Text>
                </View>
              )}
            />
            <TouchableOpacity style={styles.closeSheet} onPress={() => setGrupoSelecionado([])}>
              <Text style={[styles.closeSheetText, {color: theme.colors.primary}]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
