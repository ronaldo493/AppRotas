import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import BottomTabNavigator from './BottomTabNavigator';
import HeaderMenu from '../../components/HeaderMenu';
import Sidebar from '../../components/Sidebar';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} />}
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        header: ({ options }) => (
          <HeaderMenu 
            navigation={navigation} 
            title={''} 
          />
        ),
      })}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerTitle: 'Início' }} 
      />
    </Drawer.Navigator>
  );
}

export default function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* O Stack abre o DrawerLayout, que por sua vez abre as abas inferiores */}
      <Stack.Screen 
        name="MainDrawer" 
        component={DrawerLayout} 
      />
      
      {/* 💡 Dica de ouro: Se você tiver telas cheias que NÃO devem mostrar a barra de abas embaixo,
          como por exemplo as telas de "Settings" ou "EditProfile", registre-as aqui no Stack:
          
          <Stack.Screen name="Settings" component={SettingsStack} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
      */}
    </Stack.Navigator>
  );
}