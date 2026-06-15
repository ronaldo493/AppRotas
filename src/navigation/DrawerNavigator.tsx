import React from 'react';

import { createDrawerNavigator } from '@react-navigation/drawer';

import HeaderMenu from '../../components/HeaderMenu';
import Sidebar from '../../components/Sidebar';

import { getThemeStyles } from '../../components/styles/ThemeStyles';

import { useTheme } from '../context/ThemeContext';

import AddPoint from '../../screens/Pontos';
import EditProfile from '../../screens/Auth/EditProfile';
import Chamados from '../../screens/Chamados';
import Historico from '../../screens/Historico';
import Home from '../../screens/Home';
import MapaLojas from '../../screens/MapaLojas';

import About from '../../screens/Settings/About';
import Suporte from '../../screens/Settings/Suporte';

import SettingsStack from './SettingStackNavigator';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  const { isDarkMode } = useTheme();

  const ThemeStyles = getThemeStyles(isDarkMode);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <Sidebar {...props} />
      )}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerTitle: '',
        headerStyle: {
          backgroundColor: isDarkMode
            ? '#333'
            : '#f0f0f0',
        },
        headerTintColor: isDarkMode
          ? '#B0B3B8'
          : '#000000',

        headerRight: () => (
          <HeaderMenu
            navigation={navigation}
            themeStyles={ThemeStyles}
          />
        ),
      })}
    >
      <Drawer.Screen name="Home" component={Home} />

      <Drawer.Screen
        name="Historico"
        component={Historico}
      />

      <Drawer.Screen
        name="MapaLojas"
        component={MapaLojas}
      />

      <Drawer.Screen
        name="AddPoint"
        component={AddPoint}
      />

      <Drawer.Screen
        name="Chamados"
        component={Chamados}
      />

      {/* <Drawer.Screen
        name="Preventiva"
        component={PreventivaStack}
      /> */}

      <Drawer.Screen
        name="Settings"
        component={SettingsStack}
      />

      <Drawer.Screen
        name="Suporte"
        component={Suporte}
      />

      <Drawer.Screen
        name="About"
        component={About}
      />

      <Drawer.Screen
        name="EditProfile"
        component={EditProfile}
      />
    </Drawer.Navigator>
  );
}