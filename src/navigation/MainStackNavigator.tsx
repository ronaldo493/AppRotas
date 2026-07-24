import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import BottomTabNavigator from './BottomTabNavigator';
import HeaderMenu from '../components/HeaderMenu';
import Sidebar from '../components/Sidebar';
import Profile from '../screens/Settings/Profile';
import About from '../screens/Settings/About';
import Home from '../screens/Home/Home';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerLayout() {
  return (
    <Drawer.Navigator
      drawerContent={Sidebar}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        header: () => (<HeaderMenu navigation={navigation} title={''} />),
        drawerType: 'front',
        detachInactiveScreens: true,
      })}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerTitle: 'Início' }} 
      />

       <Drawer.Screen
        name="EditProfile"
        component={Profile}
        options={{drawerItemStyle: { display: 'none' } }}
      />

      <Drawer.Screen
        name="Sobre"
        component={About}
        options={{drawerItemStyle: { display: 'none' }}}
      />

      <Drawer.Screen
        name="Inicio"
        component={Home}
        options={{drawerItemStyle: { display: 'none' }}}
      />
    </Drawer.Navigator>
  );
}

export default function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MainDrawer" 
        component={DrawerLayout} 
      />
    </Stack.Navigator>
  );
}