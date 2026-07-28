import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Marker, type LatLng, type MarkerPressEvent} from 'react-native-maps';

interface ClusterMarkerProps {
  coordinate: LatLng;
  count: number;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
}

function ClusterMarker({
  coordinate,
  count,
  backgroundColor,
  textColor,
  onPress,
}: ClusterMarkerProps): React.JSX.Element {
  const [tracksViewChanges, setTracksViewChanges] =
    useState(true);

  /*
   * Marcadores customizados precisam ser capturados pelo mapa
   * quando mudam. Depois da captura, desativar o rastreamento
   * evita redesenho contínuo no Android.
   */
  useEffect(() => {
    setTracksViewChanges(true);

    const timeout = setTimeout(() => {
      setTracksViewChanges(false);
    }, 120);

    return () => {
      clearTimeout(timeout);
    };
  }, [backgroundColor, count, textColor]);

  const handlePress = (event: MarkerPressEvent): void => {
    event.stopPropagation();
    onPress();
  };

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={tracksViewChanges}
      anchor={{x: 0.5, y: 0.5}}
      zIndex={count}
      onPress={handlePress}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor: textColor,
          },
        ]}
      >
        <Text style={[styles.text, {color: textColor}]}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    </Marker>
  );
}

export default React.memo(ClusterMarker);

const styles = StyleSheet.create({
  container: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 19,
    elevation: 4,
  },

  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});
