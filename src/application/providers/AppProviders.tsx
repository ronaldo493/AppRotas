import React, {useMemo} from 'react';
import {PaperProvider} from 'react-native-paper';

import {AuthProvider} from '../../core/auth/AuthContext';
import {LocationProvider} from '../../core/location/LocationContext';
import {
  ThemeProvider,
  useThemeContext,
} from '../../core/theme/ThemeContext';

import AppToast from '../../shared/components/AppToast';
import AppVersionChecker from '../../features/atualizacao/components/AppVersionChecker';
import AppNavigation from '../navigation/AppNavigation';
import {createAppTheme} from '../../core/theme/appTheme';
import AppDataProviders from './AppDataProviders';
import LocalizacaoRotaGuard from '../../features/execucaoRota/components/LocalizacaoRotaGuard';

function AppWithTheme() {
  const { isDarkMode } = useThemeContext();

  const theme = useMemo(
    () => createAppTheme(isDarkMode),
    [isDarkMode],
  );

  return (
    <PaperProvider theme={theme}>
      <LocationProvider>
        <AppVersionChecker />
        <AppNavigation />
        <LocalizacaoRotaGuard />
        <AppToast />
      </LocationProvider>
    </PaperProvider>
  );
}

export default function AppProviders() {
  return (
    <AuthProvider>
      <AppDataProviders>
        <ThemeProvider>
          <AppWithTheme />
        </ThemeProvider>
      </AppDataProviders>
    </AuthProvider>
  );
}
