import {
  MD3LightTheme,
  MD3DarkTheme,
  useTheme,
} from 'react-native-paper';

const customLightColors = {
  primary: '#C4473D',
  onPrimary: '#FFFFFF',

  background: '#F6F6F7',
  onBackground: '#3e3e42',

  surface: '#FFFFFF',
  onSurface: '#54545a',

  surfaceVariant: '#F3F4F6',
  onSurfaceVariant: '#60646C',

  outline: '#E4E4E7',

  sidebar: '#FFFFFF',
  tabBarBackground: '#FFFFFF',

  actionBackground: '#636468',
  actionForeground: '#FFFFFF',

  secondaryActionBackground: '#FFFFFF',
  secondaryActionForeground: '#24262B',

  buttonBackground: '#F3F4F6',
  buttonForeground: '#24262B',

  iconDefault: '#71717A',
  iconActive: '#C4473D',

  primarySoft: '#FAECEA',
  muted: '#F4F4F5',

  card: '#FFFFFF',

  profileCircle: '#FAECEA',

  success: '#2E7D32',
  info: '#2563EB',
  warning: '#D97706',
};

const customDarkColors = {
  primary: '#DD6258',
  onPrimary: '#FFFFFF',

  background: '#161719',
  onBackground: '#F4F4F5',

  surface: '#202225',
  onSurface: '#F4F4F5',

  surfaceVariant: '#292C30',
  onSurfaceVariant: '#B8BBC1',

  outline: 'rgba(255, 255, 255, 0.09)',

  sidebar: '#18191B',
  tabBarBackground: '#1B1C1F',

  actionBackground: '#3A3D43',
  actionForeground: '#F4F4F5',

  secondaryActionBackground: '#292C30',
  secondaryActionForeground: '#F4F4F5',

  buttonBackground: '#292C30',
  buttonForeground: '#F4F4F5',

  iconDefault: '#A1A1AA',
  iconActive: '#F4F4F5',

  primarySoft: 'rgba(221, 98, 88, 0.14)',
  muted: '#242629',

  card: '#202225',

  profileCircle: 'rgba(221, 98, 88, 0.12)',

  success: '#4CAF50',
  info: '#60A5FA',
  warning: '#F59E0B',
};


export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#232730' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A0A5B0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#232730' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#383D4A' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#F5F6F6' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#1E2530' }],
  },
];

export const lightMapStyle = [
  // { elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
  // { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  // { elementType: 'labels.text.fill', stylers: [{ color: '#A32D34' }] },
  // { elementType: 'labels.text.stroke', stylers: [{ color: '#FDFDFD' }] },
  // {
  //   featureType: 'road',
  //   elementType: 'geometry',
  //   stylers: [{ color: '#F1F4F9' }],
  // },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2F343F' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#DCE4F0' }],
  },
];

export const createAppTheme = (isDarkMode: boolean) => {
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const customColors = isDarkMode
    ? customDarkColors
    : customLightColors;

  return {
    ...baseTheme,

    roundness: 3,

    colors: {
      ...baseTheme.colors,
      ...customColors,
    },

    custom: {
      isDarkMode,
      mapStyle: isDarkMode ? darkMapStyle : lightMapStyle,
      radius: 12,
    },
  };
};

export type AppTheme = ReturnType<typeof createAppTheme>;

export const useAppTheme = () => useTheme<AppTheme>();
