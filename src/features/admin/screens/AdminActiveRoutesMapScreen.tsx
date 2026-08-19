import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE, type Region} from 'react-native-maps';

import {useAppTheme} from '../../../core/theme/appTheme';
import AdminModuleHeader from '../components/AdminModuleHeader';
import useAdminActiveRoutesMap from '../hooks/useAdminActiveRoutesMap';
import type {AdminActiveRouteLocation} from '../models/AdminActiveRoutesMap';
import {rotaAtivaPossuiLocalizacao} from '../models/AdminActiveRoutesMap';
import styles from '../styles/adminActiveRoutesMap.styles';
import {
  obterIniciaisColaborador,
} from '../useCases/formatAdminActiveRoutesMap';
import AdminRouteMapScreen from './AdminRouteMapScreen';

const INITIAL_REGION: Region = {
  latitude: -22.72,
  longitude: -47.64,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

/** Mostra somente posições capturadas durante execuções monitoradas em andamento. */
export default function AdminActiveRoutesMapScreen({
  onBack,
}: {
  onBack: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const mapRef = useRef<MapView>(null);
  const fittedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] =
    useState<AdminActiveRouteLocation | null>(null);
  const painel = useAdminActiveRoutesMap(true);
  const rotas = painel.data?.rotas ?? [];
  const rotasNoMapa = useMemo(
    () => rotas.filter(rotaAtivaPossuiLocalizacao),
    [rotas],
  );
  const scope = painel.data?.escopo.abrangencia === 'todos_setores'
    ? 'Todos os setores'
    : painel.data?.escopo.setor ?? 'Seu setor';

  useEffect(() => {
    if (!mapReady || fittedRef.current || rotasNoMapa.length === 0) return;
    fittedRef.current = true;
    const coordinates = rotasNoMapa.map(item => ({
      latitude: item.latitude,
      longitude: item.longitude,
    }));
    if (coordinates.length === 1) {
      mapRef.current?.animateToRegion({
        ...coordinates[0],
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 300);
      return;
    }
    mapRef.current?.fitToCoordinates(coordinates, {
      animated: true,
      edgePadding: {top: 54, right: 42, bottom: 54, left: 42},
    });
  }, [mapReady, rotasNoMapa]);

  const corEstado = (item: AdminActiveRouteLocation): string => {
    if (item.estado === 'atual') return theme.colors.success;
    if (item.estado === 'atrasada') return theme.colors.warning;
    return theme.colors.iconDefault;
  };

  if (painel.loading && !painel.data) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
          <AdminModuleHeader title="Rotas em andamento" onBack={onBack} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
            Carregando percursos em andamento...
          </Text>
        </View>
      </View>
    );
  }

  if (painel.error && !painel.data) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
          <AdminModuleHeader title="Rotas em andamento" onBack={onBack} />
        </View>
        <View style={styles.centered}>
          <Text style={[styles.stateTitle, {color: theme.colors.onBackground}]}>
            Não foi possível abrir o mapa
          </Text>
          <Text style={[styles.stateText, {color: theme.colors.onSurfaceVariant}]}>
            {painel.error}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => void painel.retry()}
            style={[styles.retryButton, {backgroundColor: theme.colors.actionBackground}]}
          >
            <Text style={[styles.retryText, {color: theme.colors.actionForeground}]}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalRotas = painel.data?.totais.rotasEmAndamento ?? rotas.length;
  const aguardando = painel.data?.totais.aguardandoPrimeiroLote ?? 0;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.header, {borderBottomColor: theme.colors.outline}]}>
        <AdminModuleHeader title="Rotas em andamento" scope={scope} onBack={onBack} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryText, {color: theme.colors.onSurface}]}>
            {totalRotas} {totalRotas === 1 ? 'rota ativa' : 'rotas ativas'} · {rotasNoMapa.length} no mapa
          </Text>
          <Text style={[styles.updateText, {color: theme.colors.onSurfaceVariant}]}>
            {painel.refreshing ? 'Atualizando...' : 'Atualiza a cada 15 s'}
          </Text>
        </View>
        <Text style={[styles.helperText, {color: theme.colors.onSurfaceVariant}]}>
          Somente localizações coletadas durante percursos iniciados.
        </Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: theme.colors.success}]} />
            <Text style={[styles.legendText, {color: theme.colors.onSurfaceVariant}]}>Até 2 min</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: theme.colors.warning}]} />
            <Text style={[styles.legendText, {color: theme.colors.onSurfaceVariant}]}>2 a 15 min</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: theme.colors.iconDefault}]} />
            <Text style={[styles.legendText, {color: theme.colors.onSurfaceVariant}]}>Mais de 15 min</Text>
          </View>
        </View>
        {painel.error ? (
          <Text style={[styles.inlineError, {color: theme.colors.primary}]}>
            {painel.error}
          </Text>
        ) : null}
      </View>

      <View style={styles.mapContainer}>
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
        >
          {rotasNoMapa.map(item => (
            <Marker
              key={item.codigoSessao}
              coordinate={{latitude: item.latitude, longitude: item.longitude}}
              title={item.username}
              accessibilityLabel={`Abrir trajeto de ${item.username}`}
              onPress={() => setRotaSelecionada(item)}
            >
              <View style={[
                styles.marker,
                {
                  backgroundColor: corEstado(item),
                  borderColor: theme.colors.onPrimary,
                },
              ]}>
                <Text style={[styles.markerText, {color: theme.colors.onPrimary}]}>
                  {obterIniciaisColaborador(item.username)}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {totalRotas === 0 ? (
          <View style={[styles.overlay, {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline}]}>
            <Text style={[styles.overlayTitle, {color: theme.colors.onSurface}]}>
              Nenhuma rota em andamento
            </Text>
            <Text style={[styles.overlayText, {color: theme.colors.onSurfaceVariant}]}>
              O mapa exibirá um marcador quando um percurso monitorado for iniciado e enviar localização.
            </Text>
          </View>
        ) : aguardando > 0 ? (
          <View style={[styles.overlay, {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline}]}>
            <Text style={[styles.overlayTitle, {color: theme.colors.onSurface}]}>
              {aguardando} {aguardando === 1 ? 'rota aguarda' : 'rotas aguardam'} o primeiro lote
            </Text>
            <Text style={[styles.overlayText, {color: theme.colors.onSurfaceVariant}]}>
              A origem planejada não é usada como posição do colaborador.
            </Text>
          </View>
        ) : null}
      </View>

      <AdminRouteMapScreen
        codigoSessao={rotaSelecionada?.codigoSessao ?? null}
        nomeColaborador={rotaSelecionada?.username ?? null}
        onClose={() => setRotaSelecionada(null)}
      />
    </View>
  );
}
