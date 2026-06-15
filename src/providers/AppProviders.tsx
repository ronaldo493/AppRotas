import React from 'react';
import { MD2DarkTheme, MD2LightTheme, Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider } from '../context/AuthContext';
import { StrapiProvider } from '../context/StrapiContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

import AppNavigation from '../navigation/AppNavigation';

function AppWithTheme() {
  const { isDarkMode } = useTheme();

  return (
    <PaperProvider theme={isDarkMode ? MD2DarkTheme : MD2LightTheme}>
      <AppNavigation />
    </PaperProvider>
  );
}

export default function AppProviders() {
  return (
    <StrapiProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppWithTheme />
        </ThemeProvider>
      </AuthProvider>
    </StrapiProvider>
  );
}