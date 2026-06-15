import React from 'react';
import {
  ActivityIndicator,
  StatusBar,
  View,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';

import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';

export default function AppNavigation() {
  const { loading, isLoggedIn, user } = useAuthContext();
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#333' : '#fff' }}>
        <ActivityIndicator size="large" color="#A82329" />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#333' : '#f0f0f0'}
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