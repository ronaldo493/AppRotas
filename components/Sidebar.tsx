import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from './styles/ThemeStyles';
import { useThemeContext } from '../src/context/ThemeContext';
import { useAuthContext } from '../src/context/AuthContext';

export default function Sidebar(props: DrawerContentComponentProps) {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useAppTheme();
  const { clearToken, user } = useAuthContext();
  
  //Captura os espaçamentos seguros do dispositivo
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    clearToken();
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top, // Adiciona o padding superior seguro
          paddingBottom: insets.bottom > 0 ? insets.bottom : 16 // Adiciona o padding inferior seguro, com fallback para 16
        }
      ]}
    >
      <View style={styles.headerUser}>
        <Text style={[styles.welcomeText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
          Bem-vindo,
        </Text>
        <Text style={[styles.userNameText, { color: theme.colors.foreground }]}>
          {user?.username || 'Usuário'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Conteúdo Central da Sidebar */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={styles.menuItem}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <MaterialIcons 
              name={isDarkMode ? 'dark-mode' : 'light-mode'} 
              size={24} 
              color={'#64748B'}
            />
            <Text style={[styles.menuText, { color: theme.colors.foreground }]}>
              Modo Escuro
            </Text>
          </View>

          <MaterialIcons 
            name={isDarkMode ? 'toggle-on' : 'toggle-off'} 
            size={36} 
            color={isDarkMode ? theme.colors.primary : '#CBD5E1'}
          />
        </TouchableOpacity>
      </View>

      {/* Botão de Sair fixado na parte inferior */}
      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.buttonLogoff, { backgroundColor: theme.colors.primary }]}
        accessibilityLabel="Sair do aplicativo"
      >
        <MaterialIcons name="logout" size={20} color={theme.colors.primaryForeground} />
        <Text style={[styles.logoffText, { color: theme.colors.primaryForeground }]}>
          SAIR
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerUser: {
    paddingVertical: 16,
    paddingHorizontal: 4,
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
    marginBottom: 16,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonLogoff: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  logoffText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});