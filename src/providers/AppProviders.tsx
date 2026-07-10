import React, { useMemo } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import { AuthProvider } from '../context/AuthContext';
import { StrapiProvider } from '../context/StrapiContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';

import { createAppTheme } from '../../components/styles/ThemeStyles'; 

import AppNavigation from '../navigation/AppNavigation';

function AppWithTheme() {
  const { isDarkMode } = useThemeContext();

  const theme = useMemo(
    () => createAppTheme(isDarkMode),
    [isDarkMode],
  );

  return (
    <PaperProvider theme={theme}>
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