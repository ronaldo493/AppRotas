import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import  {Text, View} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE,} from 'react-native-maps';
import { ActivityIndicator, Banner, Searchbar} from 'react-native-paper';

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
      ? [
          {
            label: feedback.actionLabel,
            onPress: feedback.onAction,
          },
        ]
      : [];

  const storeCountLabel =
    lojas.length === 1
      ? 'filial exibida'
      : 'filiais exibidas';

  return (
    <View
      style={[
        MapaLojasStyles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <Searchbar
        value={search}
        onChangeText={setSearch}
        onClearIconPress={clearSearch}
        placeholder="Buscar cidade, filial ou código"
        style={[
          MapaLojasStyles.search,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
        inputStyle={{color: theme.colors.onSurface}}
        iconColor={theme.colors.iconDefault}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      <View style={MapaLojasStyles.mapContainer}>
        <MapView
          ref={mapRef}
          key={
            theme.custom.isDarkMode
              ? 'dark-map'
              : 'light-map'
          }
          provider={PROVIDER_GOOGLE}
          style={MapaLojasStyles.map}
          initialRegion={initialRegion}
          customMapStyle={theme.custom.mapStyle}
          showsUserLocation={currentLocation !== null}
          showsMyLocationButton={currentLocation !== null}
          zoomEnabled
          zoomControlEnabled
        >
          {lojas.map(
            ({
              filial,
              coordinate,
              address,
            }) => (
              <Marker
                key={String(filial.codigofilial)}
                coordinate={coordinate}
                title={`${filial.codigofilial} - ` + filial.nomefilial}
                description={address}
                tracksViewChanges={false}
              />
            ),
          )}
        </MapView>

        {!loading && (
          <View
            pointerEvents="none"
            style={[
              MapaLojasStyles.storeCountBadge,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            <MaterialIcons
              name="storefront"
              size={18}
              color={theme.colors.primary}
            />

            <Text
              style={[
                MapaLojasStyles.storeCountText,
                {
                  color: theme.colors.onSurface,
                },
              ]}
            >
              {lojas.length}{' '}
              {storeCountLabel}
            </Text>
          </View>
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
                shadowColor: theme.colors.shadow,
              },
            ]}
            contentStyle={MapaLojasStyles.bannerContent}
          >
            <Text
              style={[
                MapaLojasStyles.bannerText,
                {
                  color: theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {feedback.message}
            </Text>
          </Banner>
        )}

        {loading && (
          <View
            pointerEvents="none"
            style={MapaLojasStyles.loadingOverlay}
          >
            <View
              style={[
                MapaLojasStyles.loadingCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                  shadowColor:theme.colors.shadow,
                },
              ]}
            >
              <ActivityIndicator size="large" color={ theme.colors.primary}/>

              <Text
                style={[
                  MapaLojasStyles .loadingText,
                  {
                    color: theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                Carregando lojas...
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}