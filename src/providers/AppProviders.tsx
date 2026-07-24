import React, { useMemo } from 'react';
import { PaperProvider } from 'react-native-paper';

import { AuthProvider } from '../context/AuthContext';
import { StrapiProvider } from '../context/StrapiContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';

import AppNavigation from '../navigation/AppNavigation';
import { createAppTheme } from '../components/ThemeStyles';
import AppToast from '../components/AppToast';

function AppWithTheme() {
  const { isDarkMode } = useThemeContext();

  const theme = useMemo(
    () => createAppTheme(isDarkMode),
    [isDarkMode],
  );

  return (
    <PaperProvider theme={theme}>
      <AppNavigation />
      <AppToast />
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