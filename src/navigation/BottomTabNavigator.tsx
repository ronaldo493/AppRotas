import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import Home from '../../screens/Home';
import MapaLojas from '../../screens/MapaLojas';
import Historico from '../../screens/Historico';
import Pontos from '../../screens/Pontos';

import MoreMenuModal from '../../components/MoreMenuModal';
import { useAuthContext } from '../context/AuthContext';
import { getThemeStyles } from '../../components/styles/ThemeStyles';
import { useTheme } from '../context/ThemeContext';

type MenuItem = {
  titulo: string;
  rota: string;
  icone?: string;
  ativo?: boolean;
  ordem?: number;
};

const Tab = createBottomTabNavigator();

const screensMap: Record<string, React.ComponentType<any>> = {
  Home,
  MapaLojas,
  Historico,
  Pontos,
};

export default function BottomTabNavigator({ navigation }: { navigation: any }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuthContext() as any;

  const { isDarkMode } = useTheme();
  const theme = getThemeStyles(isDarkMode);

  const menusOrdenados: MenuItem[] = (user?.menus || [])
    .filter((m: MenuItem) => m.ativo !== false)
    .sort((a: MenuItem, b: MenuItem) => (a.ordem || 0) - (b.ordem || 0));

  const totalMenus = menusOrdenados.length;

  if (totalMenus === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background || '#232730', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primaryIconFocus || '#CA484A'} />
        <Text style={{ color: theme.colors.foreground || '#F5F6F6', marginTop: 12, fontWeight: '500' }}>
          Carregando menus...
        </Text>
      </View>
    );
  }

  let menusDaTab: MenuItem[] = [];
  let menusDoModal: MenuItem[] = [];

  if (totalMenus > 4) {
    menusDaTab = menusOrdenados.slice(0, 4); 
    menusDoModal = menusOrdenados.slice(4);
  } else {
    menusDaTab = menusOrdenados;
    menusDoModal = [];
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';

            if (route.name === 'Mais') {
              iconName = 'more-horiz';
            } else {
              const menu = menusOrdenados.find((m: MenuItem) => m.titulo === route.name);
              iconName = menu?.icone || 'circle';
            }

            return (
              <MaterialIcons
                name={iconName as any}
                size={focused ? size + 3 : size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: theme.colors.primaryIconFocus,
          tabBarInactiveTintColor: theme.colors.primaryIconDarkBackground,
          tabBarStyle: { 
            paddingBottom: 12, 
            height: 70, 
            backgroundColor: theme.colors.primary,
            borderTopWidth: 0
          },
          tabBarLabelStyle: { fontSize: 13, fontWeight: '500' },
        })}
      >
        {menusDaTab.map((menu: MenuItem) => {
          const Screen = screensMap[menu.rota];
          if (!Screen) return null;

          return (
            <Tab.Screen
              key={menu.titulo}
              name={menu.titulo}
              component={Screen}
            />
          );
        })}

        {totalMenus > 4 && (
          <Tab.Screen
            name="Mais"
            component={View}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                setModalVisible(true);
              },
            }}
          />
        )}
      </Tab.Navigator>

      <MoreMenuModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
        menuItems={menusDoModal}
      />
    </>
  );
}