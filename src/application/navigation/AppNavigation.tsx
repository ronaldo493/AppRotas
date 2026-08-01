import React, {useMemo} from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  NavigationContainer,
} from '@react-navigation/native';

import {useAuthContext} from '../../core/auth/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';
import {navigationRef} from './navigationService';
import {useAppTheme} from '../../core/theme/appTheme';

export default function AppNavigation() {
  const { loading, isLoggedIn } = useAuthContext();
  
  const theme = useAppTheme();
  const isDarkMode = theme.custom.isDarkMode;
  const navigationTheme = useMemo(() => {
    const baseTheme = isDarkMode
      ? NavigationDarkTheme
      : NavigationLightTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.tabBarBackground,
        text: theme.colors.onSurface,
        border: theme.colors.outline,
        notification: theme.colors.primary,
      },
    };
  }, [isDarkMode, theme]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary}/>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.tabBarBackground}
      />

      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        {isLoggedIn()
          ? <MainStackNavigator />
          : <AuthNavigator />
        }
      </NavigationContainer>
    </>
  );
}
