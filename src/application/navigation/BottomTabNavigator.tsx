import React, {useMemo, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type {
  DrawerScreenProps,
} from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';

import {useAuthContext} from '../../core/auth/AuthContext';
import type {AuthMenu} from '../../core/auth/AuthMenu';
import {useAppTheme} from '../../core/theme/appTheme';
import AdminScreen from '../../features/admin/AdminScreen';
import ChamadosScreen from '../../features/chamados/ChamadosScreen';
import ContatosScreen from '../../features/contatos/screens/ContatosScreen';
import MapaFiliaisScreen from '../../features/filiais/screens/MapaFiliaisScreen';
import HistoricoScreen from '../../features/historico/screens/HistoricoScreen';
import PontosScreen from '../../features/pontos/screens/PontosScreen';
import PreventivaScreen from '../../features/preventiva/PreventivaScreen';
import RotasScreen from '../../features/rotas/screens/RotasScreen';
import MoreMenuModal from '../../shared/components/MoreMenuModal';
import {obterNomeIconeMaterial} from '../../shared/icons/materialIcon';
import type {
  BottomTabParamList,
  DrawerParamList,
} from './navigationTypes';

type BottomTabNavigatorProps = DrawerScreenProps<
  DrawerParamList,
  'MainTabs'
>;

const Tab =
  createBottomTabNavigator<BottomTabParamList>();
const EmptyScreen = () => null;

const screensMap: Record<
  string,
  React.ComponentType<object>
> = {
  Home: RotasScreen,
  MapaLojas: MapaFiliaisScreen,
  Historico: HistoricoScreen,
  Pontos: PontosScreen,
  Preventiva: PreventivaScreen,
  Chamados: ChamadosScreen,
  Contatos: ContatosScreen,
  Admin: AdminScreen,
};

export default function BottomTabNavigator({
  navigation,
}: BottomTabNavigatorProps): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const {user} = useAuthContext();

  const theme = useAppTheme();

  const menusOrdenados = useMemo<AuthMenu[]>(
    () =>
      (user?.menus ?? [])
        .filter(menu => menu.ativo !== false)
        .sort(
          (first, second) =>
            (first.ordem ?? 0) - (second.ordem ?? 0),
        ),
    [user?.menus],
  );

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

  let menusDaTab: AuthMenu[] = [];
  let menusDoModal: AuthMenu[] = [];

  if (totalMenus > 4) {
    menusDaTab = menusOrdenados.slice(0, 4); 
    menusDoModal = menusOrdenados.slice(4);
  } else {
    menusDaTab = menusOrdenados;
    menusDoModal = [];
  }

  return (
    <View style={styles.container}>
      <Tab.Navigator
        detachInactiveScreens
        screenOptions={({ route }) => ({
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';

            if (route.name === 'Mais') {
              iconName = 'more-horiz';
            } else {
              const menu = menusOrdenados.find(
                item => item.titulo === route.name,
              );
              iconName = obterNomeIconeMaterial(
                menu?.icone,
              );
            }

            return (
              <MaterialIcons
                name={obterNomeIconeMaterial(iconName)}
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
        {menusDaTab.map((menu: AuthMenu) => {
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
        {menusDoModal.map((menu: AuthMenu) => {
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
