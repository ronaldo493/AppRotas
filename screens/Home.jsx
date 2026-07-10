import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import RouteList from '../components/RouteList';
import SearchBar from '../components/SearchBar';
import { useAppTheme } from '../components/styles/ThemeStyles';
import MapService from '../fixtures/mapService';
import HomeStyles from './styles/HomeStyles';
import useAuth from '../hooks/useAuth';;
import Toast from 'react-native-toast-message';
import useCheckVersion from '../hooks/useCheckVersion';

export default function Home() {
  const [routes, setRoutes] = useState([]); //Estado que armazena as rotas/filiais selecionadas pelo usuário

  //Modo escuro
  const themeStyles = useAppTheme();
  
  //Execução de chekToken no carregamento da tela
  const { checkToken, token, message } = useAuth();
  const { currentVersion, error, loading } = useCheckVersion();

  useEffect(() => {
    if (token) {
      checkToken(token);
    }
  }, [token]);

  //Função para adicionar uma filial
  const handleAddRoute = (filial) => {
    if (routes.some(route => route.codigofilial === filial.codigofilial)){
      Alert.alert('Atenção!', 'Filial já adicionada.');
      return;
    }
    setRoutes([...routes, filial]);
  };

  //Função para remover uma rota/filial
  const handleRemoveRoute = (filialToRemove) => {
    setRoutes(routes.filter(filial => filial.codigofilial !== filialToRemove.codigofilial));
  };

  //Função para reordenar rotas
  const handleReorderRoutes = (updatedRoutes) => {
    setRoutes(updatedRoutes);
  };

  //Função Salvar histórico
  const saveHistory = async () => {
    const currentDate = new Date().toLocaleString(); //Obtém a data atual

    try {
      //Tenta pegar o histórico de rotas que já está salvo
      const history = await AsyncStorage.getItem('routeHistory');

      //Se tiver alguma coisa no histórico, transforma em objeto; se não, cria um array vazio
      const parsedHistory = history ? JSON.parse(history) : [];
  
      //Transforma a rota com informações do Código e cidade
      const updatedRoute = {
        date: currentDate,
        routes: routes.map(route => ({
          codigofilial: route.codigofilial,
          nomecidade: route.nomecidade,
        })),  
      };

      parsedHistory.push(updatedRoute);
      await AsyncStorage.setItem('routeHistory', JSON.stringify(parsedHistory));
    } catch (error) {
      throw new Error('Não foi possível salvar o histórico.');
    }
  }

  //Função para abrir o maps ou o waze e salvar o historico
  const handleOpenGoogleMaps = async () => {
    try {
      await saveHistory();
      MapService.openGoogleMapsRoute(routes);
    } catch (error) {
      Alert.alert('Erro ao salvar o histórico', error.message);
    }
  };
  
  const handleOpenWaze = async () => {
    try {
      await saveHistory();
      MapService.openWazeRoute(routes); 
    } catch (error) {
      Alert.alert('Erro ao salvar o histórico', error.message);
    }
  };

  //Função para traçar a rota
  const handleTraceRoute = async () => {
    if (routes.length === 0) {
      Alert.alert('Atenção!', 'Nenhuma filial selecionada');
      return;
    }
    
    
      Alert.alert(
        'Escolha o Navegador',
        'Deseja abrir a rota no Google Maps ou no Waze?',
        [
          { text: 'Google Maps', onPress: handleOpenGoogleMaps },
          { text: 'Waze', onPress: handleOpenWaze },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
  };

  return (
    <View style={[HomeStyles.container, themeStyles.screenBackground]}>
      <View style={HomeStyles.logoContainer}>
        <Image source={require('../assets/img/drogal.png')} style={[HomeStyles.logo, themeStyles.logoImg]} />
      </View>
      <SearchBar onAddRoute={handleAddRoute} />
      <View style={HomeStyles.routeContainer}>
        <View style={{ flex: 1 }}> 
          <RouteList 
            routes={routes} 
            onRemoveRoute={handleRemoveRoute} 
            onReorderRoutes={handleReorderRoutes} 
          />
        </View>
        {message && (
          <View style={{ backgroundColor: "#87CEEB", padding: 30, marginBottom:20 }}>
            <Text style={{ color: "white" }}>{message}</Text>
          </View>
        )}
        <Toast/>

        <TouchableOpacity onPress={handleTraceRoute}>
          <Text style={[themeStyles.textBackground, themeStyles.buttonBackgroundScreen]}>
            TRAÇAR ROTA
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
