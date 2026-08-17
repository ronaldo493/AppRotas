import {MaterialIcons} from '@expo/vector-icons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {DrawerScreenProps} from '@react-navigation/drawer';
import React, { useEffect, useMemo, useState} from 'react';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAuthContext} from '../../core/auth/AuthContext';
import {useAppTheme} from '../../core/theme/appTheme';
import MoreMenuModal from '../../features/menus/components/MoreMenuModal';
import {obterNomeIconeMaterial} from '../../shared/icons/materialIcon';
import {appLogger} from '../../shared/logging/appLogger';
import styles from './bottomTabNavigator.styles';
import {isMenuRouteName, menuScreenRegistry, resolveMenuNavigation, type MenuRouteName} from './menuRegistry';
import type { BottomTabParamList, DrawerParamList} from './navigationTypes';

type BottomTabNavigatorProps = DrawerScreenProps<DrawerParamList, 'MainTabs'>;

const PRIMARY_MENU_LIMIT = 4;
const Tab = createBottomTabNavigator<BottomTabParamList>();
const EmptyScreen = (): null => null;

/**
 * Monta as abas a partir dos acessos do usuário, usando a rota como chave
 * técnica e o título do Strapi apenas como rótulo visual.
 */
export default function BottomTabNavigator({navigation}: BottomTabNavigatorProps): React.JSX.Element {
  const [modalVisible, setModalVisible] = useState(false);
  const {user} = useAuthContext();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const {menus: orderedMenus, unsupportedRoutes} = useMemo(
    () => resolveMenuNavigation(user?.menus ?? []),
    [user?.menus],
  );

  const menuByRoute = useMemo(
    () => new Map(
      orderedMenus.map(menu => [menu.rota, menu]),
    ),
    [orderedMenus],
  );

  useEffect(() => {
    if (unsupportedRoutes.length > 0) {
      appLogger.warn('Rotas de menu não registradas no aplicativo:', unsupportedRoutes.join(', '));
    }
  }, [unsupportedRoutes]);

  if (orderedMenus.length === 0) {
    return (
      <View style={[styles.emptyState, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.emptyStateText, {color: theme.colors.onBackground}]}>
          Nenhum menu disponível para o seu acesso.
        </Text>
      </View>
    );
  }

  const primaryMenus = orderedMenus.slice(0, PRIMARY_MENU_LIMIT);
  const overflowMenus = orderedMenus.slice(PRIMARY_MENU_LIMIT);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        detachInactiveScreens
        screenOptions={({route}) => ({
          headerShown: false,
          lazy: true,
          /*
           * As telas não são congeladas para continuarem reagindo a mudanças
           * globais, como tema e sessão, mesmo após navegar pelo drawer.
           */
          freezeOnBlur: false,
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({
            focused,
            color,
            size,
          }) => {
            const iconName = route.name === 'Mais'
              ? 'more-horiz'
              : menuByRoute.get(
                  route.name as MenuRouteName,
                )?.icone;

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
          tabBarStyle: [
            styles.tabBar,
            {
              height: 69 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor:
                theme.colors.tabBarBackground,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
        })}
      >
        {primaryMenus.map(menu => (
          <Tab.Screen
            key={menu.rota}
            name={menu.rota}
            component={menuScreenRegistry[menu.rota]}
            options={{
              title: menu.titulo,
              tabBarLabel: menu.titulo,
            }}
          />
        ))}

        {overflowMenus.map(menu => (
          <Tab.Screen
            key={menu.rota}
            name={menu.rota}
            component={menuScreenRegistry[menu.rota]}
            options={{
              title: menu.titulo,
              tabBarButton: () => null,
              tabBarItemStyle: {
                display: 'none',
              },
            }}
          />
        ))}

        {overflowMenus.length > 0 && (
          <Tab.Screen
            name="Mais"
            component={EmptyScreen}
            listeners={{
              tabPress: event => {
                event.preventDefault();
                setModalVisible(true);
              },
            }}
          />
        )}
      </Tab.Navigator>

      <MoreMenuModal
        visible={modalVisible}
        menuItems={overflowMenus}
        onClose={() => setModalVisible(false)}
        onNavigate={routeName => {
          if (!isMenuRouteName(routeName)) return;

          navigation.navigate('MainTabs', {
            screen: routeName,
          });
        }}
      />
    </View>
  );
}
