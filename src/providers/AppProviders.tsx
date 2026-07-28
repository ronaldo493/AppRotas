import React, { useMemo } from 'react';
import { PaperProvider } from 'react-native-paper';

import { AuthProvider } from '../context/AuthContext';
import { StrapiProvider } from '../context/StrapiContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';

import AppNavigation from '../navigation/AppNavigation';
import { createAppTheme } from '../components/ThemeStyles';
import AppToast from '../components/AppToast';
import { LocationProvider } from '../context/LocationContext';

function AppWithTheme() {
  const { isDarkMode } = useThemeContext();

  const theme = useMemo(
    () => createAppTheme(isDarkMode),
    [isDarkMode],
  );

  return (
    <PaperProvider theme={theme}>
      <LocationProvider>
        <AppNavigation />
        <AppToast />
      </LocationProvider>
    </PaperProvider>
  );
}

export default function AppProviders() {
  return (
    <AuthProvider>
      <StrapiProvider>
        <ThemeProvider>
          <AppWithTheme />
        </ThemeProvider>
      </StrapiProvider>
    </AuthProvider>
  );
}