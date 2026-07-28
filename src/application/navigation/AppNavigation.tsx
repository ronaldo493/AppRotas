import React from 'react';
import {ActivityIndicator, StatusBar, View} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';

import {useAuthContext} from '../../core/auth/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';
import {useAppTheme} from '../../core/theme/appTheme';

export default function AppNavigation() {
  const { loading, isLoggedIn } = useAuthContext();
  
  const theme = useAppTheme();
  const isDarkMode = theme.custom.isDarkMode;

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

      <NavigationContainer>
        {isLoggedIn()
          ? <MainStackNavigator />
          : <AuthNavigator />
        }
      </NavigationContainer>
    </>
  );
}
