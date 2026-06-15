import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getThemeStyles } from '../components/styles/ThemeStyles';
import { useTheme } from '../src/context/ThemeContext';
import RouteListStyles from './styles/RouteListStyles';

export default function RouteList({ routes, onRemoveRoute, onReorderRoutes}) {
  //Modo escuro
  const { isDarkMode } = useTheme(); 
  const themeStyles = getThemeStyles(isDarkMode);
  
  //Renderenização de cada Item da Lista
  const renderItem = ({ item, drag, isActive }) => (
    <View style={[
       RouteListStyles.routeItem, 
      themeStyles.listRoutes, 
      isActive ? { backgroundColor: isDarkMode ? '#ccc' : '#bbb' } : {} ]}
    >
      

      <TouchableOpacity onPressIn={drag}>
        <Icon name="drag-handle" size={30} color={isDarkMode ? '#666' : '#666'} />
      </TouchableOpacity>
      <Text style={[RouteListStyles.text, themeStyles.text]}>{item.nomefilial}</Text>
      <TouchableOpacity onPress={() => onRemoveRoute(item)}>
      <Icon name="delete" size={24} color={isDarkMode ? '#990000' : '#cc0000'} />
      </TouchableOpacity>
    </View>
  );

  //Exibição da Lista
  return (
    <DraggableFlatList
      data={routes}
      onDragEnd={({ data }) => onReorderRoutes(data)}
      keyExtractor={(item) => item.codigofilial.toString()} //Usa o código da filial como chave
      renderItem={renderItem}
      style={RouteListStyles.list}
    />
  );
}
