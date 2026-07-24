import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export default function useLocation() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  //Função para obter a localização
  const getLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      //Solicita permissão para acessar a localização
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão de localização negada');
        setError('Permissão de localização negada');
        return;
      }

      //Obtém a posição atual do usuário
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      //Atualiza o estado com a localização atual
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    } catch (err) {
      console.error("Erro ao obter a localização:", err);
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return { currentLocation, mapRegion, setMapRegion, error, loading };
}