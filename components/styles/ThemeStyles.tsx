const lightTheme = {
  background: '#FDFDFD',
  foreground: '#2C3138',
  card: '#FFFFFF',
  primary: '#fdfdfd',
  primaryIconDarkBackground: '#5e5a5a',
  primaryIconFocus:'#B84233',
  primarySoft: '#FCECEB',
  secondary: '#F1F4F9',
  muted: '#F6F6F5',
  border: '#EAEAEA',
  radius: 12,
  profileCircle: 'rgba(223, 22, 35, 0.19)',
};

const darkTheme = {
  background: '#232730',
  foreground: '#F5F6F6',
  card: '#2D323E',
  primary: '#323233',
  primaryIconDarkBackground: '#c5bfbf',
  primaryIconFocus:'#ece3e3',
  primarySoft: '#5A2628',
  secondary: '#383D4A',
  muted: '#383D4A',
  border: 'rgba(255, 255, 255, 0.08)',
  radius: 12,
  profileCircle: 'rgba(238, 156, 156, 0.15)',
};

export const getThemeStyles = (isDarkMode: boolean) => {
  const colors = isDarkMode ? darkTheme : lightTheme;

  return {
    colors,
    isDarkMode,
    mapStyle: isDarkMode ? darkMapStyle : lightMapStyle,
  };
};

export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#232730' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A0A5B0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#232730' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383D4A' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#F5F6F6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1E2530' }] },
];

export const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#FDFDFD' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A32D34' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FDFDFD' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F1F4F9' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#2F343F' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DCE4F0' }] },
];