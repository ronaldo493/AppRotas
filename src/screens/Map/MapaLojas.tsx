import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ActivityIndicator, Banner, Searchbar, Surface } from 'react-native-paper';

import { useAppTheme } from '../../components/ThemeStyles';
import useMapaLojas from './hook/useMapaLojas';
import MapaLojasStyles from './styles/MapaLojasStyles';

export default function MapaLojas(): React.JSX.Element {
  const theme = useAppTheme();

  const {
    mapRef,
    search,
    setSearch,
    clearSearch,
    lojas,
    initialRegion,
    currentLocation,
    loading,
    feedback,
  } = useMapaLojas();

  const bannerActions =
    feedback?.actionLabel && feedback.onAction
      ? [{ label: feedback.actionLabel, onPress: feedback.onAction }]
      : [];

  const storeCountLabel = lojas.length === 1 ? 'filial exibida' : 'filiais exibidas';

  return (
    <View style={[MapaLojasStyles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        ref={mapRef}
        key={theme.custom.isDarkMode ? 'dark-map' : 'light-map'}
        provider={PROVIDER_GOOGLE}
        style={MapaLojasStyles.map}
        initialRegion={initialRegion}
        customMapStyle={theme.custom.mapStyle}
        showsUserLocation={currentLocation !== null}
        showsMyLocationButton={currentLocation !== null}
        zoomEnabled
        zoomControlEnabled={false}
        toolbarEnabled={false}
        mapPadding={{ top: 75, right: 0, bottom: 0, left: 0 }}
      >
        {lojas.map(({ filial, coordinate, address }) => (
          <Marker
            key={String(filial.codigofilial)}
            coordinate={coordinate}
            title={`${filial.codigofilial} - ${filial.nomefilial}`}
            description={address}
            tracksViewChanges={false}
          />
        ))}
      </MapView>

      <Surface
        elevation={3}
        style={[
          MapaLojasStyles.searchContainer,
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
          inputStyle={[MapaLojasStyles.searchInput, { color: theme.colors.onSurface }]}
          style={[MapaLojasStyles.search, { backgroundColor: theme.colors.surface }]}
          elevation={0}
        />
      </Surface>

      {!loading && (
        <Surface
          elevation={2}
          pointerEvents="none"
          style={[
            MapaLojasStyles.storeCountBadge,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <MaterialIcons name="storefront" size={17} color={theme.colors.primary} />

          <Text style={[MapaLojasStyles.storeCountText, { color: theme.colors.onSurface }]}>
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
            MapaLojasStyles.bannerOverlay,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
          contentStyle={MapaLojasStyles.bannerContent}
        >
          <Text style={[MapaLojasStyles.bannerText, { color: theme.colors.onSurfaceVariant }]}>
            {feedback.message}
          </Text>
        </Banner>
      )}

      {loading && (
        <View pointerEvents="none" style={MapaLojasStyles.loadingOverlay}>
          <Surface
            elevation={4}
            style={[
              MapaLojasStyles.loadingCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />

            <Text style={[MapaLojasStyles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Carregando lojas...
            </Text>
          </Surface>
        </View>
      )}
    </View>
  );
}