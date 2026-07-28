import { MaterialIcons } from '@expo/vector-icons';
import React, {useMemo} from 'react';
import {Text, useWindowDimensions, View} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ActivityIndicator, Banner, Searchbar, Surface } from 'react-native-paper';

import ClusterMarker from '../../../shared/components/maps/ClusterMarker';
import {useAppTheme} from '../../../core/theme/appTheme';
import {clusterMapItems} from '../../../shared/maps/clustering';
import useMapaFiliais from '../hooks/useMapaFiliais';
import styles from './mapaFiliais.styles';
import type {LojaMapa} from '../utils/mapaFilialUtils';

const MAP_PADDING = {top: 75, right: 0, bottom: 0, left: 0};

const getLojaCoordinate = (loja: LojaMapa) => loja.coordinate;
const getLojaKey = (loja: LojaMapa): string =>
  String(loja.filial.codigofilial);

export default function MapaFiliaisScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {width, height} = useWindowDimensions();

  const {
    mapRef,
    search,
    setSearch,
    clearSearch,
    lojas,
    initialRegion,
    currentLocation,
    mapReady,
    visibleRegion,
    onMapReady,
    onRegionChangeComplete,
    focusLojas,
    loading,
    feedback,
  } = useMapaFiliais();

  const bannerActions =
    feedback?.actionLabel && feedback.onAction
      ? [{ label: feedback.actionLabel, onPress: feedback.onAction }]
      : [];

  const storeCountLabel = lojas.length === 1 ? 'filial exibida' : 'filiais exibidas';

  const clusters = useMemo(
    () =>
      mapReady
        ? clusterMapItems({
            items: lojas,
            region: visibleRegion,
            viewportWidth: width,
            viewportHeight: height,
            getCoordinate: getLojaCoordinate,
            getKey: getLojaKey,
          })
        : [],
    [height, lojas, mapReady, visibleRegion, width],
  );

  const markers = useMemo(
    () =>
      clusters.map(cluster => {
        if (cluster.items.length === 1) {
          const {filial, coordinate, address} =
            cluster.items[0];

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
            count={cluster.items.length}
            backgroundColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            onPress={() => focusLojas(cluster.items)}
          />
        );
      }),
    [
      clusters,
      focusLojas,
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

      {!loading && (
        <Surface
          elevation={2}
          pointerEvents="none"
          style={[
            styles.storeCountBadge,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <MaterialIcons name="storefront" size={17} color={theme.colors.primary} />

          <Text style={[styles.storeCountText, { color: theme.colors.onSurface }]}>
            {lojas.length} {storeCountLabel}
          </Text>
        </Surface>
      )}

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
    </View>
  );
}
