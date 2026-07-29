import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';

import BottomTabNavigator from './BottomTabNavigator';
import AboutScreen from '../../features/configuracoes/AboutScreen';
import ProfileScreen from '../../features/configuracoes/ProfileScreen';
import useMenuAccessSync from '../../features/menus/hooks/useMenuAccessSync';
import PatrimonioScreen from '../../features/preventiva/PatrimonioScreen';
import HeaderMenu from '../../shared/components/HeaderMenu';
import Sidebar from '../../shared/components/Sidebar';
import type {
  DrawerParamList,
  RootStackParamList,
} from './navigationTypes';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const renderDrawerContent = (props: DrawerContentComponentProps): React.JSX.Element => <Sidebar {...props} />;

function DrawerLayout() {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      detachInactiveScreens
      screenOptions={({ navigation }) => ({
        headerShown: true,
        header: () => (<HeaderMenu navigation={navigation} title={''} />),
        drawerType: 'front',
        freezeOnBlur: true,
      })}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={BottomTabNavigator} 
        options={{ headerTitle: 'Início' }} 
      />

       <Drawer.Screen
        name="EditProfile"
        component={ProfileScreen}
        options={{drawerItemStyle: { display: 'none' } }}
      />

      <Drawer.Screen
        name="Sobre"
        component={AboutScreen}
        options={{drawerItemStyle: { display: 'none' }}}
      />

    </Drawer.Navigator>
  );
}

export default function MainStackNavigator() {
  useMenuAccessSync();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MainDrawer" 
        component={DrawerLayout} 
      />

      <Stack.Screen
        name="Patrimonio"
        component={PatrimonioScreen}
        options={{
          headerShown: true,
          title: 'Registro de patrimônio',
        }}
      />
    </Stack.Navigator>
  );
}
