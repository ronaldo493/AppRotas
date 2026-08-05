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
import ForcedPasswordChangeGate from '../../core/auth/forcedPasswordChange/components/ForcedPasswordChangeGate';
import DeviceSessionMonitor from '../../core/auth/deviceSession/components/DeviceSessionMonitor';

function AppWithTheme() {
  const { isDarkMode } = useThemeContext();

  const theme = useMemo(
    () => createAppTheme(isDarkMode),
    [isDarkMode],
  );

  return (
    <PaperProvider theme={theme}>
      <DeviceSessionMonitor />
      <ForcedPasswordChangeGate>
        <AppDataProviders>
          <LocationProvider>
            <AppVersionChecker />
            <AppNavigation />
            <LocalizacaoRotaGuard />
          </LocationProvider>
        </AppDataProviders>
      </ForcedPasswordChangeGate>
      <AppToast />
    </PaperProvider>
  );
}

export default function AppProviders() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </AuthProvider>
  );
}
