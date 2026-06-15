import React, { useState, useCallback } from 'react';
import { TouchableOpacity, GestureResponderEvent, View, StyleSheet, Platform, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Menu, Divider } from 'react-native-paper';
import { useAuthContext } from '../src/context/AuthContext';
import { getThemeStyles } from './styles/ThemeStyles';
import { useTheme } from '../src/context/ThemeContext';

interface HeaderMenuProps {
  navigation: any;
  title?: string;
}

const HeaderMenu: React.FC<HeaderMenuProps> = React.memo(({ navigation, title }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number } | null>(null);

  const { isDarkMode } = useTheme();
  const theme = getThemeStyles(isDarkMode);
  const { clearToken } = useAuthContext();

  const handleLogout = () => {
    setIsMenuVisible(false);
    clearToken();
  };

  const openMenu = useCallback((event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    setAnchorPosition({ x: pageX, y: pageY });
    setIsMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
      <TouchableOpacity 
        onPress={() => {
          if (typeof navigation.openDrawer === 'function') {
            navigation.openDrawer();
          } else if (navigation.getParent && typeof navigation.getParent().openDrawer === 'function') {
            navigation.getParent().openDrawer();
          }
        }} 
        activeOpacity={0.7} 
        style={styles.iconButton}
      >
        <MaterialIcons name="menu" size={28} color={theme.colors.primaryIconDarkBackground} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={[styles.headerTitle, { color: theme.colors.primaryIconDarkBackground }]}>
          {title ? title.toUpperCase() : ''}
        </Text>
      </View>

      <TouchableOpacity 
        onPress={openMenu} 
        activeOpacity={0.7} 
        style={[styles.profileIconButton, { backgroundColor: theme.colors.profileCircle }]}
      >
        <MaterialIcons 
          name="person-outline" 
          size={26} 
          color={theme.colors.primaryIconDarkBackground} 
        />
      </TouchableOpacity>

      <Menu
        visible={isMenuVisible}
        onDismiss={closeMenu}
        anchor={{ x: anchorPosition?.x || 0, y: anchorPosition?.y || 0 }}
      >
        <Menu.Item
          onPress={() => {
            closeMenu();
            navigation.navigate('Settings');
          }}
          title="Configurações"
          titleStyle={{ color: theme.colors.foreground, fontSize: 14 }}
        />
        <Divider style={{ backgroundColor: theme.colors.border }} />
        <Menu.Item
          onPress={() => {
            closeMenu();
            navigation.navigate('EditProfile');
          }}
          title="Meu Perfil"
          titleStyle={{ color: theme.colors.foreground, fontSize: 14 }}
        />
        <Divider style={{ backgroundColor: theme.colors.border }} />
        <Menu.Item
          onPress={handleLogout}
          title="Sair"
          titleStyle={{ color: theme.colors.foreground, fontWeight: 'bold', fontSize: 14 }}
        />
      </Menu>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    height: Platform.OS === 'ios' ? 105 : 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6, 
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});

export default HeaderMenu;