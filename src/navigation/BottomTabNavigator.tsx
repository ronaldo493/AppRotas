import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import MoreMenuModal from '../components/MoreMenuModal';
import { useAuthContext } from '../context/AuthContext';

import Historico from '../screens/History/Historico';
import Home from '../screens/Home/Home';
import MapaLojas from '../screens/Map/MapaLojas';
import Pontos from '../screens/Points/Pontos';
import Preventiva from '../screens/Preventive/Preventiva';
import Chamados from '../screens/SupportTickets/Chamados';
import { useAppTheme } from '../components/ThemeStyles';
import Sugestion from '../components/Sugestion/Sugestion';

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
  Preventiva,
  Chamados
};

export default function BottomTabNavigator({ navigation }: { navigation: any }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuthContext() as any;

  const theme = useAppTheme();

  const menusOrdenados: MenuItem[] = (user?.menus || [])
    .filter((m: MenuItem) => m.ativo !== false)
    .sort((a: MenuItem, b: MenuItem) => (a.ordem || 0) - (b.ordem || 0));

  const totalMenus = menusOrdenados.length;

  if (totalMenus === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background || '#232730', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.iconActive || '#CA484A'} />
        <Text style={{ color: theme.colors.onBackground || '#F5F6F6', marginTop: 12, fontWeight: '500' }}>
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

  const EmptyScreen = () => null;

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
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
          tabBarActiveTintColor: theme.colors.iconActive,
          tabBarInactiveTintColor: theme.colors.iconDefault,
          tabBarStyle: { 
            height: 85, 
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: theme.colors.tabBarBackground,
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
        {menusDoModal.map((menu: MenuItem) => {
          const Screen = screensMap[menu.rota];
          if (!Screen) return null;

          return (
            <Tab.Screen
              key={menu.titulo}
              name={menu.titulo}
              component={Screen}
              options={{
                title: menu.titulo,
                tabBarButton: () => null,
                tabBarItemStyle: {
                  display: 'none',
                },
              }}
            />
          );
        })}

        {totalMenus > 4 && (
          <Tab.Screen
            name="Mais"
            component={EmptyScreen}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                setModalVisible(true);
              },
            }}
          />
        )}
      </Tab.Navigator>

      <Sugestion />

      <MoreMenuModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        menuItems={menusDoModal}
        onNavigate={routeName => {
          navigation.navigate('MainTabs', {
            screen: routeName,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});