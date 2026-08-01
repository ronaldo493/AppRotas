import {createNavigationContainerRef} from '@react-navigation/native';

import type {MenuRouteName} from './menuRegistry';
import type {RootStackParamList} from './navigationTypes';

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

/**
 * Abre uma tela registrada no menu inferior usando a navegação raiz.
 */
export const navigateToMenu = (route: MenuRouteName): boolean => {
  if (!navigationRef.isReady()) return false;

  navigationRef.navigate('MainDrawer', {
    screen: 'MainTabs',
    params: {screen: route},
  });
  return true;
};

/**
 * Abre telas auxiliares que pertencem ao drawer, mas não aparecem como menu.
 */
export const navigateToDrawerScreen = (
  route: 'EditProfile' | 'Sobre',
): boolean => {
  if (!navigationRef.isReady()) return false;

  navigationRef.navigate('MainDrawer', {screen: route});
  return true;
};

export const navigateBack = (): boolean => {
  if (!navigationRef.isReady() || !navigationRef.canGoBack()) return false;

  navigationRef.goBack();
  return true;
};

/** Retorna a tela mais interna em foco para interpretação contextual. */
export const getCurrentRouteName = (): string | undefined =>
  navigationRef.isReady()
    ? navigationRef.getCurrentRoute()?.name
    : undefined;
