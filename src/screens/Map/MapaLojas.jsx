import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import useLocation from '../../hooks/useLocation';
import MapaLojasStyles from './styles/MapaLojasStyles';
import Toast from 'react-native-toast-message';
import { useAppTheme } from '../../components/ThemeStyles';
import useFiliais from '../../hooks/useFiliais';

export default function MapaLojas(){
  //Modo escuro
  const themeStyles = useAppTheme();
  const isDarkMode = themeStyles.custom.isDarkMode;

  //Lista de filiais do contexto
  const { filiais } = useFiliais();

  //Estado para armazenar a cidade digitada, a região do mapa e a localização atual
  const [searchCity, setSearchCity] = useState('');
  const [filteredFiliais, setFilteredFiliais] = useState([]);

  const { currentLocation, mapRegion, setMapRegion, error, loading } = useLocation();

  //Função para remover acentos e normalizar o texto
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD') //Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') //Remove os acentos
      .trim(); //Remove espaços em branco nas pontas
  };

  //Atualiza os marcadores e a região do mapa ao carregar as filiais
  useEffect(() => {
    if (filiais.length > 0) {
      setFilteredFiliais(filiais);

      const primeiraFilial = filiais.find((filial)  => filial.nomefilial === "Piracicaba")

      if (primeiraFilial) {
        const latitude = parseFloat(primeiraFilial.latitude?.replace(',', '.'));
        const longitude = parseFloat(primeiraFilial.longitude?.replace(',', '.'));
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    }
  }, [filiais]);

  //Função para atualizar a busca com debounce
  const searchCityDebounced = useCallback(
    debounce((city) => {
      const filiaisFiltradas = filiais.filter((filial) =>
        normalizeText(filial.nomecidade).includes(normalizeText(city))
      );

      if (filiaisFiltradas.length > 0) {
        const firstFilial = filiaisFiltradas[0];
        const latitude = parseFloat(firstFilial.latitude?.replace(',', '.'));
        const longitude = parseFloat(firstFilial.longitude?.replace(',', '.'));

        if (latitude && longitude) {
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      }

      setFilteredFiliais(filiaisFiltradas);
    }, 300),
    [filiais]
  );

  //Limpa o debounce ao desmontar o componente
  useEffect(() => {
    return () => {
      searchCityDebounced.cancel();
    };
  }, [searchCityDebounced]);

  //Atualiza a cidade digitada
  const searchCityChange = (text) => {
    setSearchCity(text);
    searchCityDebounced(text);
  };

  return (
    <View style={[MapaLojasStyles.container, themeStyles.screenBackground]}>
      <TextInput
        style={[MapaLojasStyles.input, themeStyles.input]}
        placeholder="DIGITE A CIDADE"
        placeholderTextColor={isDarkMode ? '#ccc' : '#333'}
        value={searchCity}
        onChangeText={searchCityChange}
      />
    <Toast/>
      {/* Exibe o carregamento enquanto os dados estão sendo buscados */}
      {loading && (
        <View >
          <ActivityIndicator size="large" />
        </View>
      )}

      {/* Exibe erro, caso haja */}
      {error && (
        <View >
          <Text style={themeStyles.errorText}>{error}</Text>
        </View>
      )}
      
      <MapView
        key={isDarkMode ? 'dark' : 'light'}
        provider={MapView.PROVIDER_GOOGLE}
        showsUserLocation={true} //Exibe o ícone de localização do usuário
        zoomEnabled={true} //Permite zoom
        //followUserLocation={true} //Faz o mapa seguir o usuário
        zoomControlEnabled={true} //Exibe controles de zoom no mapa
        style={MapaLojasStyles.map}
        region={mapRegion}
        customMapStyle={themeStyles.mapStyle}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Localização Atual"
            pinColor="blue"
          />
        )}

        {filteredFiliais.map(filial => {
          //Converte as coordenadas para números
          const latitude = parseFloat(filial.latitude);
          const longitude = parseFloat(filial.longitude);

          //Verifica se ambos são números válidos
          if (!isNaN(latitude) && !isNaN(longitude)) {
            return (
              <Marker
                key={filial.codigofilial}
                coordinate={{ latitude, longitude }}
                title={filial.nomefilial}
                description={`Endereço: ${filial.endereco}, ${filial.numero}, ${filial.bairro}, ${filial.nomecidade}`}
              />
            );
          }
          return null;
        })}
      </MapView>
    </View>
  );
};
