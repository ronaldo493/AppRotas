import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import MapView, { Marker, type LatLng, type MapPressEvent } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, FAB, Surface } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import { useAppTheme } from '../../components/ThemeStyles';
import useLocation from '../../hooks/useLocation';
import usePontos from '../../hooks/usePontosDeInteresse';
import { DEFAULT_REGION, getCoordinates } from '../../utils/coordinateUtils';
import PontoForm, { type CategoriaPonto } from './components/PontoForm';
import AddPointStyles from './styles/AddPointStyles';

interface PontoInteresse {
  id?: number;
  documentId?: string;
  latitude: string | number;
  longitude: string | number;
  descricao: string;
  categoria: CategoriaPonto;
}

interface NovoPonto {
  latitude: string;
  longitude: string;
  descricao: string;
  categoria: CategoriaPonto;
}

interface PontoMapa extends PontoInteresse {
  coordinate: LatLng;
  uniqueKey: string;
}

export default function Pontos(): React.JSX.Element {
  const theme = useAppTheme();
  const mapRef = useRef<MapView | null>(null);

  const { pontos, loading, error, postPontos } = usePontos();
  const { currentLocation, mapRegion } = useLocation();

  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<LatLng | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);

  const currentCoordinate = useMemo<LatLng | null>(() => {
    return currentLocation ? getCoordinates(currentLocation) : null;
  }, [currentLocation]);

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
  };

  const handleMapPress = (event: MapPressEvent): void => {
    if (!isAddMode) return;

    Keyboard.dismiss();
    setSelectedPoint(event.nativeEvent.coordinate);
  };

  const handleCurrentLocation = (): void => {
    Keyboard.dismiss();

    if (!currentCoordinate) {
      Toast.show({
        type: 'info',
        text1: 'Localização indisponível',
        text2: 'Aguarde alguns segundos ou toque em um local no mapa.',
        position: 'top',
      });

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

    const novoPonto: NovoPonto = {
      latitude: selectedPoint.latitude.toString(),
      longitude: selectedPoint.longitude.toString(),
      descricao: description.trim(),
      categoria,
    };

    Keyboard.dismiss();
    setCategoryDialogVisible(false);
    setSaving(true);

    try {
      await postPontos(novoPonto);

      Toast.show({
        type: 'success',
        text1: 'Ponto salvo com sucesso',
        text2: categoria,
        position: 'top',
      });

      resetAddPoint();
    } catch (requestError: unknown) {
      console.error('Erro ao salvar ponto:', requestError);

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

  const getMarkerColor = (categoria: CategoriaPonto): string => {
    return categoria === 'Restaurante'
      ? theme.colors.primary
      : theme.colors.success;
  };

  return (
    <View style={[AddPointStyles.container, { backgroundColor: theme.colors.background }]}>
      <MapView
        ref={mapRef}
        key={theme.custom.isDarkMode ? 'dark-map' : 'light-map'}
        initialRegion={mapRegion ?? DEFAULT_REGION}
        customMapStyle={theme.custom.mapStyle}
        showsUserLocation={Boolean(currentCoordinate)}
        showsMyLocationButton={Boolean(currentCoordinate)}
        zoomEnabled
        zoomControlEnabled={false}
        style={AddPointStyles.map}
        onPress={handleMapPress}
      >
        {pontosValidos.map(point => (
          <Marker
            key={point.uniqueKey}
            coordinate={point.coordinate}
            title={point.descricao}
            description={point.categoria}
            pinColor={getMarkerColor(point.categoria)}
          />
        ))}

        {selectedPoint && isAddMode && (
          <Marker
            coordinate={selectedPoint}
            title="Novo ponto"
            description="Arraste para ajustar"
            pinColor={theme.colors.info}
            draggable
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
          onPress={() => setIsAddMode(true)}
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
    </View>
  );
}