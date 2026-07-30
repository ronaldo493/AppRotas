import { MaterialIcons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {useAuthContext} from '../../core/auth/AuthContext';
import {useAssistentePreferences} from '../../core/preferences/AssistentePreferencesContext';
import {useThemeContext} from '../../core/theme/ThemeContext';
import {useAppTheme} from '../../core/theme/appTheme';

function Sidebar({
  navigation,
  state,
}: DrawerContentComponentProps): React.JSX.Element {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const {
    respostasFaladasAtivas,
    preferenciasCarregadas,
    alternarRespostasFaladas,
  } = useAssistentePreferences();
  const { clearToken, user } = useAuthContext();

  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = insets.bottom > 0 ? insets.bottom : 16;
  const currentRoute = state.routeNames[state.index];

  const isHomeActive = currentRoute === 'MainTabs';
  const isProfileActive = currentRoute === 'EditProfile';
  const isAboutActive = currentRoute === 'Sobre';

  const handleToggleTheme = (): void => {
    void toggleTheme();
  };

  const handleToggleAssistantVoice = (): void => {
    if (!preferenciasCarregadas) return;

    void alternarRespostasFaladas();
  };

  const handleLogout = (): void => {
    void clearToken();
  };

  const handleNavigate = (route: string): void => {
    navigation.closeDrawer();
    navigation.navigate(route);
  };

  const handleNavigateHome = (): void => {
    navigation.closeDrawer();

    navigation.navigate('MainTabs');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.sidebar,
          paddingTop: insets.top,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={styles.headerUser}>
        {/* <Text style={[styles.welcomeText, { color: theme.colors.onSurfaceVariant }]}>
          Bem-vindo,
        </Text> */}

        <Text style={[styles.userNameText, { color: theme.colors.onBackground }]}>
          {user?.username || 'Usuário'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.outline }]}/>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          onPress={handleNavigateHome}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir início"
          style={[
            styles.menuItem,
            {
              backgroundColor: isHomeActive
                ? theme.colors.surfaceVariant
                : 'transparent',
            },
          ]}
        >
          <View style={[styles.menuIconContainer, {backgroundColor: theme.colors.surfaceVariant}]}>
            <MaterialIcons
              name="home"
              size={21}
              color={theme.colors.iconDefault}
            />
          </View>

          <Text
            style={[
              styles.menuText,
              {
                color: theme.colors.onSurface,
                fontWeight: isHomeActive ? '700' : '500',
              },
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleNavigate('EditProfile')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir meu perfil"
          style={[
            styles.menuItem,
            {
              backgroundColor: isProfileActive
                ? theme.colors.surfaceVariant
                : 'transparent',
            },
          ]}
        >
          <View style={[styles.menuIconContainer, {backgroundColor: theme.colors.surfaceVariant}]} >
            <MaterialIcons
              name="person-outline"
              size={21}
              color={ theme.colors.iconDefault}
            />
          </View>

          <Text
            style={[
              styles.menuText,
              {
                color: theme.colors.onSurface,
                fontWeight: isProfileActive ? '700' : '500',
              },
            ]}
          >
            Meu perfil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleNavigate('Sobre')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir informações sobre o aplicativo"
          style={[
            styles.menuItem,
            {
              backgroundColor: isAboutActive
                ? theme.colors.surfaceVariant
                : 'transparent',
            },
          ]}
        >
          <View style={[styles.menuIconContainer, { backgroundColor:theme.colors.surfaceVariant}]}>
            <MaterialIcons
              name="info-outline"
              size={21}
              color={theme.colors.iconDefault}
            />
          </View>

          <Text
            style={[
              styles.menuText,
              {
                color:theme.colors.onSurface,
                fontWeight: isAboutActive ? '700' : '500',
              },
            ]}
          >
            Sobre
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footer,{ borderTopColor: theme.colors.outline }]}>
        <TouchableOpacity
          onPress={handleToggleAssistantVoice}
          activeOpacity={0.7}
          disabled={!preferenciasCarregadas}
          accessibilityRole="switch"
          accessibilityLabel="Respostas faladas da assistente"
          accessibilityHint="Ativa ou desativa somente a voz das respostas"
          accessibilityState={{
            checked: respostasFaladasAtivas,
            disabled: !preferenciasCarregadas,
          }}
          style={[
            styles.themeButton,
            {
              backgroundColor: theme.colors.surfaceVariant,
              opacity: preferenciasCarregadas ? 1 : 0.6,
            },
          ]}
        >
          <View style={styles.themeButtonLeft}>
            <MaterialIcons
              name={
                respostasFaladasAtivas
                  ? 'record-voice-over'
                  : 'voice-over-off'
              }
              size={21}
              color={theme.colors.iconDefault}
            />

            <View>
              <Text
                style={[
                  styles.themeText,
                  {color: theme.colors.onSurface},
                ]}
              >
                Voz da assistente
              </Text>
              <Text
                style={[
                  styles.preferenceDescription,
                  {color: theme.colors.onSurfaceVariant},
                ]}
              >
                {respostasFaladasAtivas ? 'Ativada' : 'Desativada'}
              </Text>
            </View>
          </View>

          <MaterialIcons
            name={respostasFaladasAtivas ? 'toggle-on' : 'toggle-off'}
            size={38}
            color={
              respostasFaladasAtivas
                ? theme.colors.primary
                : theme.colors.iconDefault
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleTheme}
          activeOpacity={0.7}
          accessibilityRole="switch"
          accessibilityState={{ checked: isDarkMode }}
          style={[styles.themeButton, { backgroundColor: theme.colors.surfaceVariant}]}
        >
          <View style={styles.themeButtonLeft}>
            <MaterialIcons
              name="dark-mode"
              size={21}
              color={theme.colors.iconDefault}
            />

            <Text style={[styles.themeText, { color: theme.colors.onSurface }]} >
              Modo escuro
            </Text>
          </View>

          <MaterialIcons
            name={isDarkMode ? 'toggle-on' : 'toggle-off'}
            size={38}
            color={
              isDarkMode
                ? theme.colors.primary
                : theme.colors.iconDefault
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sair do aplicativo"
          style={[
            styles.buttonLogoff,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          <MaterialIcons
            name="logout"
            size={21}
            color={theme.colors.onSurfaceVariant}
          />

          <Text style={[ styles.logoffText,{ color: theme.colors.onSurfaceVariant }]}>
            SAIR
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(Sidebar);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  headerUser: {
    paddingVertical: 16,
    paddingHorizontal: 4
  },

  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },

  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },

  divider: {
    height: 1,
    marginHorizontal: 4,
    marginBottom: 14,
  },

  menuContainer: {
    flex: 1,
    gap: 6,
  },

  menuItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 16,
  },

  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  menuText: {
    fontSize: 16,
  },

  footer: {
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 14,
  },

  themeButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 28,
  },

  themeButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  themeText: {
    fontSize: 15,
    fontWeight: '600',
  },

  preferenceDescription: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14,
  },

  buttonLogoff: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 26,
  },

  logoffText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
