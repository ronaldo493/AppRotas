import {
  MD3LightTheme,
  MD3DarkTheme,
  useTheme,
} from 'react-native-paper';

const customLightColors = {
  background: '#FDFDFD',
  foreground: '#2C3138',
  card: '#FFFFFF',
  primary: '#ffffff',
  primaryIconDarkBackground: '#5e5a5a',
  primaryIconFocus: '#B84233',
  primarySoft: '#FCECEB',
  secondary: '#F1F4F9',
  muted: '#F6F6F5',
  border: '#EAEAEA',
  profileCircle: 'rgba(223, 22, 35, 0.19)',
};

const customDarkColors = {
  background: '#232730',
  foreground: '#F5F6F6',
  card: '#2D323E',
  primary: '#47403f',
  primaryIconDarkBackground: '#c5bfbf',
  primaryIconFocus: '#ece3e3',
  primarySoft: '#5A2628',
  secondary: '#383D4A',
  muted: '#383D4A',
  border: 'rgba(255, 255, 255, 0.08)',
  profileCircle: 'rgba(238, 156, 156, 0.15)',
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
  { elementType: 'geometry', stylers: [{ color: '#FDFDFD' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A32D34' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FDFDFD' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#F1F4F9' }],
  },
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

      surface: customColors.card,
      onSurface: customColors.foreground,
      onBackground: customColors.foreground,
      outline: customColors.border,
      surfaceVariant: customColors.secondary,
      onSurfaceVariant: customColors.foreground,

      primaryContainer: customColors.primarySoft,
      onPrimaryContainer: customColors.foreground,
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