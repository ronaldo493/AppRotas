import React, {useCallback, useMemo, useState} from 'react';
import {Text, useWindowDimensions, View} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ActivityIndicator, Banner, Searchbar, Surface } from 'react-native-paper';

import ClusterMarker from '../../../shared/components/maps/ClusterMarker';
import {useAppTheme} from '../../../core/theme/appTheme';
import {MapClusterIndex} from '../../../shared/maps/clustering';
import DistribuicaoFiliaisSheet from '../components/DistribuicaoFiliaisSheet';
import MapaResumoDistribuicao from '../components/MapaResumoDistribuicao';
import useMapaFiliais from '../hooks/useMapaFiliais';
import styles from './mapaFiliais.styles';
import type {LojaMapa} from '../utils/mapaFilialUtils';

const MAP_PADDING = {top: 155, right: 0, bottom: 0, left: 0};

const getLojaCoordinate = (loja: LojaMapa) => loja.coordinate;
const getLojaKey = (loja: LojaMapa): string =>
  String(loja.filial.codigofilial);

export default function MapaFiliaisScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {width, height} = useWindowDimensions();
  const [distribuicaoVisivel, setDistribuicaoVisivel] = useState(false);

  const {
    mapRef,
    search,
    setSearch,
    clearSearch,
    lojas,
    distribuicao,
    filtroDistribuicao,
    aplicarFiltroDistribuicao,
    limparFiltroDistribuicao,
    initialRegion,
    currentLocation,
    mapReady,
    visibleRegion,
    onMapReady,
    onRegionChangeComplete,
    loading,
    feedback,
  } = useMapaFiliais();

  const bannerActions =
    feedback?.actionLabel && feedback.onAction
      ? [{ label: feedback.actionLabel, onPress: feedback.onAction }]
      : [];

  /*
   * O índice é reconstruído somente quando as lojas mudam. Movimentar o mapa
   * apenas consulta a estrutura espacial já carregada pelo Supercluster.
   */
  const clusterIndex = useMemo(
    () =>
      new MapClusterIndex({
        items: lojas,
        getCoordinate: getLojaCoordinate,
        getKey: getLojaKey,
      }),
    [lojas],
  );

  /*
   * Retorna apenas clusters e pontos da região visível no zoom atual,
   * reduzindo a quantidade de markers montados pelo React Native Maps.
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
   * Abre o agrupamento usando o zoom calculado pelo próprio Supercluster,
   * sem depender de incrementos fixos que poderiam manter o cluster fechado.
   */
  const focusCluster = useCallback(
    (clusterId: number, coordinate: LojaMapa['coordinate']): void => {
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
    [clusterIndex, mapRef],
  );

  const markers = useMemo(
    () =>
      clusters.map(cluster => {
        if (cluster.item) {
          const {filial, coordinate, address} = cluster.item;

          return (
            <Marker
              key={cluster.id}
              coordinate={coordinate}
              title={`${filial.codigofilial} - ${filial.nomefilial}`}
              description={address}
              tracksViewChanges={false}
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
      theme.colors.onPrimary,
      theme.colors.primary,
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={theme.custom.mapStyle}
        loadingEnabled
        showsUserLocation={currentLocation !== null}
        showsMyLocationButton={currentLocation !== null}
        zoomEnabled
        zoomControlEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        mapPadding={MAP_PADDING}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {markers}
      </MapView>

      <Surface
        elevation={3}
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Searchbar
          value={search}
          onChangeText={setSearch}
          onClearIconPress={clearSearch}
          placeholder="Buscar cidade, filial ou código"
          iconColor={theme.colors.iconDefault}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          inputStyle={[styles.searchInput, { color: theme.colors.onSurface }]}
          style={[styles.search, { backgroundColor: theme.colors.surface }]}
          elevation={0}
        />
      </Surface>

      {!loading && distribuicao.totalFiliais > 0 ? (
        <MapaResumoDistribuicao
          resumo={distribuicao}
          filtro={filtroDistribuicao}
          onOpen={() => setDistribuicaoVisivel(true)}
          onClear={limparFiltroDistribuicao}
        />
      ) : null}

      {feedback && (
        <Banner
          visible
          icon={feedback.icon}
          actions={bannerActions}
          style={[
            styles.bannerOverlay,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
          contentStyle={styles.bannerContent}
        >
          <Text style={[styles.bannerText, { color: theme.colors.onSurfaceVariant }]}>
            {feedback.message}
          </Text>
        </Banner>
      )}

      {loading && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <Surface
            elevation={4}
            style={[
              styles.loadingCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />

            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Carregando lojas...
            </Text>
          </Surface>
        </View>
      )}

      <DistribuicaoFiliaisSheet
        visible={distribuicaoVisivel}
        resumo={distribuicao}
        filtro={filtroDistribuicao}
        onDismiss={() => setDistribuicaoVisivel(false)}
        onSelect={aplicarFiltroDistribuicao}
        onClear={limparFiltroDistribuicao}
      />
    </View>
  );

}
