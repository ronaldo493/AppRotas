interface MapStyle {
  elementType: string;
  featureType?: string;
  stylers: { color?: string; visibility?: string }[];
}

interface ThemeStyles {
  mapStyle: MapStyle[]; //mapStyle é um array de objetos MapStyle
  textMenu: {
    color: string;
    paddingVertical: number;
    paddingHorizontal: number;
    fontSize: number;
  };
  sidebar: {
    backgroundColor: string;
  };
  chamados: {
    backgroundColor: string;
  };
  text: {
    color: string;
  };
  buttonBackgroundSide: {
    backgroundColor: string;
  };
  screenText: {
    color: string;
  };
  screenBackground: {
    backgroundColor: string;
  };
  borderBottomColor: {
    borderBottomColor: string;
  };
  radiusBackground: {
    backgroundColor: string;
  };
  textImp: {
    color: string;
    fontStyle: string;
  };
  contentModal: {
    backgroundColor: string;
  };
  titleModal: {
    color: string;
  };
  buttonModal: {
    backgroundColor: string;
  };
  buttonModalScreen: {
    backgroundColor: string;
  };
  textModal: {
    color: string;
  };
  textBackground: {
    backgroundColor: string;
    color: string;
  };
  buttonBackgroundScreen: {
    fontSize: number;
    fontWeight: string;
    textAlign: string;
    padding: number;
    borderRadius: number;
    elevation: number;
  };
  buttonSelected: {
    backgroundColor: string;
  };
  buttonBack: {
    backgroundColor: string;
    padding: number;
    borderRadius: number;
    elevation: number;
    alignItems: string;
  };
  listSearch: {
    backgroundColor: string;
  };
  input: {
    borderWidth: number;
    borderColor: string;
    color: string;
    backgroundColor: string;
    fontSize: number;
    fontWeight: string;
    textAlign: string;
    padding: number;
    borderRadius: number;
  };
  inputPatrimonio: {
    borderWidth: number;
    borderColor: string;
    color: string;
    backgroundColor: string;
    fontSize: number;
    fontWeight: string;
    textAlign: string;
    padding: number;
    borderRadius: number;
  };
  listRoutes: {
    backgroundColor: string;
  };
  logoImg: {
    opacity: number;
  };
  checklistContainerTheme: {
    backgroundColor: string;
  };
  checklistItemTheme: {
    backgroundColor: string;
    color: string;
  };
  errorText: {
    color: string;
  };
}

const lightTheme = {
  text: '#000',
  screenText: '#000',
  sidebar: '#e7e7e7',
  chamados: '#d8d8d8',
  borderBottomColor: '#ddd',
  screenBackground: '#f5f5f5',
};

const darkTheme = {
  text: '#cccccc',
  screenText: '#E0E0E0',
  sidebar: '#2E2E2C',
  chamados: '#2E2E2C',
  borderBottomColor: '#555553',
  screenBackground: '#101010',
};


export const getThemeStyles = (isDarkMode: boolean): ThemeStyles => {
  return {
    mapStyle: isDarkMode ? darkMapStyle : lightMapStyle,

    // SIDEBAR
    sidebar: {
      backgroundColor: isDarkMode ? darkTheme.sidebar : lightTheme.sidebar,
    },
    chamados: {
      backgroundColor: isDarkMode ? darkTheme.chamados : lightTheme.chamados
    },
    text: {
      color: isDarkMode ? darkTheme.text : lightTheme.text,
    },
    textMenu: {
      color: isDarkMode ? darkTheme.text : lightTheme.text,
      paddingVertical: 10,
      paddingHorizontal: 25,
      fontSize: 14,
    },
    buttonBackgroundSide: {
      backgroundColor: isDarkMode ? '#888' : '#bbb',
    },
    // SCREEN
    screenText: {
      color: isDarkMode ? darkTheme.screenText : lightTheme.screenText,
    },
    screenBackground: {
      backgroundColor: isDarkMode ? darkTheme.screenBackground : lightTheme.screenBackground,
    },
    borderBottomColor: {
      borderBottomColor: isDarkMode ? darkTheme.borderBottomColor : lightTheme.borderBottomColor,
    },
    radiusBackground: {
      backgroundColor: isDarkMode ? '#555' : '#ddd',
    },
    textImp: {
      color: isDarkMode ? '#B22222' : '#B22222',
      fontStyle: 'italic',
    },

    // MODAL
    contentModal: {
      backgroundColor: isDarkMode ? '#333' : '#ddd',
    },
    titleModal: {
      color: isDarkMode ? '#fff' : '#000',
    },
    buttonModal: {
      backgroundColor: isDarkMode ? '#555' : '#aaa',
    },
    buttonModalScreen: {
      backgroundColor: isDarkMode ? '#888' : '#aaa',
    },
    textModal: {
      color: isDarkMode ? '#fff' : '#111',
    },

    // BUTTON
    textBackground: {
      backgroundColor: isDarkMode ? '#555553' : '#BB5059',
      color: 'white',
    },
    buttonBackgroundScreen: {
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 8,
      borderRadius: 4,
      elevation: 4,
    },
    buttonSelected: {
      backgroundColor: isDarkMode ? '#222' : '#B66',
    },
    buttonBack: {
      backgroundColor: isDarkMode ? '#222' : '#bbb',
      padding: 9,
      borderRadius: 6,
      elevation: 1,
      alignItems: 'center',
    },

    // INPUT & SEARCH
    listSearch: {
      backgroundColor: isDarkMode ? '#4d4d4d' : '#dddddd',
    },
    input: {
      borderWidth: 0.8,
      borderColor: isDarkMode ? '#777777' : '#2196F3',
      color: isDarkMode ? '#ffffff' : '#000000',
      backgroundColor: isDarkMode ? '#555' : '#ccc',
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 10,
      borderRadius: 6,
    },
    inputPatrimonio: {
      borderWidth: 0.8,
      borderColor: isDarkMode ? '#777777' : '#2196F3',
      color: isDarkMode ? '#ffffff' : '#000000',
      backgroundColor: isDarkMode ? '#555' : '#ccc',
      fontSize: 12,
      fontWeight: 'bold',
      textAlign: 'center',
      padding: 7,
      borderRadius: 8,
    },

    // ROUTES
    listRoutes: {
      backgroundColor: isDarkMode ? '#404040' : '#ffffff',
    },
    logoImg: {
      opacity: 0.4,
    },
    checklistContainerTheme: {
      backgroundColor: isDarkMode ? '#333' : '#dcdcdc',
    },
    checklistItemTheme: {
      backgroundColor: isDarkMode ? '#444' : '#f8f8f8',
      color: isDarkMode ? '#ccc' : '#000',
    },
    errorText: {
      color: '#ff4d4d',
    },
  };
};


  // Estilo do mapa Escuro
export const darkMapStyle = [
  {
    elementType: 'geometry', // Altera o fundo do mapa.
    stylers: [{ color: '#1d1d1d' }],
  },
  {
    elementType: 'labels.icon', // Controla ícones de rótulos no mapa.
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill', // Altera a cor do texto dos rótulos.
    stylers: [{ color: '#b0b0b0' }],
  },
  {
    elementType: 'labels.text.stroke', // Adiciona um contorno ao texto.
    stylers: [{ color: '#1d1d1d' }],
  },
  {
    featureType: 'administrative.land_parcel', // Estilo para áreas administrativas.
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b0b0b0' }],
  },
  {
    featureType: 'poi', // Estilo para pontos de interesse (POIs).
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8d8d8d' }],
  },
  {
    featureType: 'road', // Estilo para estradas.
    elementType: 'geometry',
    stylers: [{ color: '#555555' }],
  },
  {
    featureType: 'road', // Estilo para estradas novamente.
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'water', // Estilo para corpos d'água.
    elementType: 'geometry',
    stylers: [{ color: '#2c3e50' }],
  },
];

// Estilo do mapa Claro
export const lightMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f4f8f4' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4b8b3f' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f4f8f4' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4d7031' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#567f3b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#cfe8c6' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3a5c37' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a1c9a7' }],
  },
  {
    featureType: 'river',
    elementType: 'geometry',
    stylers: [{ color: '#75a7b4' }],
  },
];
