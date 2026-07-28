import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {useAppTheme} from '../../core/theme/appTheme';

interface HeaderMenuProps {
  navigation: {
    openDrawer: () => void;
  };
  title?: string;
}

function HeaderMenu({navigation, title}: HeaderMenuProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const handleOpenDrawer = (): void => {
    navigation.openDrawer();
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: theme.colors.tabBarBackground,
          height:
            Platform.OS === 'ios'
              ? 60 + insets.top
              : 56 + insets.top,
          paddingTop: insets.top,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleOpenDrawer}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu lateral"
        style={styles.iconButton}
      >
        <MaterialIcons
          name="menu"
          size={28}
          color={theme.colors.iconDefault}
        />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text
          numberOfLines={1}
          style={[ styles.headerTitle, { color: theme.colors.onSurface }]}
        >
          {title?.toUpperCase() ?? ''}
        </Text>
      </View>

      <View style={[styles.profileIconContainer, { backgroundColor: theme.colors.profileCircle}]}>
        <MaterialIcons
          name="person-outline"
          size={26}
          color={theme.colors.iconActive}
        />
      </View>
    </View>
  );
}

export default React.memo(HeaderMenu);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  iconButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },

  profileIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
