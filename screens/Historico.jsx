import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { getThemeStyles } from '../components/styles/ThemeStyles';
import { useTheme } from '../src/context/ThemeContext';
import HistoricoStyles from './styles/HistoricoStyles';

export default function Historico() {
  //Modo escuro
  const { isDarkMode } = useTheme(); 
  const themeStyles = getThemeStyles(isDarkMode);

  const [routeHistory, setRouteHistory] = useState([]);

  //Carregar o histórico sempre que a tela for focada
  useFocusEffect(
    React.useCallback(() => {
      const loadRouteHistory = async () => {
        try {
          const history = await AsyncStorage.getItem('routeHistory');
          if (history) {
            setRouteHistory(JSON.parse(history).reverse());
          }
        } catch (error) {
        }
      };
      loadRouteHistory();
    }, [])
  );

  //Limpar o histórico
  const clearHistory = async () => {
    if (routeHistory.length === 0) {
      Alert.alert('Atenção!', 'Histórico Vazio.');
      return;
    }
    
    Alert.alert(
      'Atenção!',
      'Você tem certeza que deseja limpar o histórico?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sim',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('routeHistory');
              setRouteHistory([]);
            } catch (error) {
              Alert.alert('Erro ao limpar o histórico:', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[HistoricoStyles.container, themeStyles.screenBackground]}>
      <Text style={[HistoricoStyles.title, themeStyles.text]}>HISTÓRICO DE ROTAS</Text>
      <FlatList
        data={routeHistory}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={[HistoricoStyles.routeItem, themeStyles.radiusBackground]}>
            <Text style={[themeStyles.text]}>DATA: {item.date}</Text>
            <Text style={[themeStyles.text]}>ROTA:</Text>
            {Array.isArray(item.routes) && item.routes.length > 0 ? ( //Verifica se 'routes' é um array
              item.routes.map((route, index) => (
                <Text key={index} style={[themeStyles. text]}>
                  FILIAL: {route.codigofilial || 'Desconhecida'}, CIDADE: {route.nomecidade || 'Desconhecida'}
                </Text>
              ))
            ) : (
              <Text>Nenhuma rota disponível</Text>
            )}
          </View>
        )}
      />
      <TouchableOpacity
        onPress={clearHistory}
      >
      <Text style={[themeStyles.textBackground, themeStyles.buttonBackgroundScreen]}> 
        LIMPAR HISTÓRICO
      </Text>
    </TouchableOpacity>
      
    </View>
  );
}
