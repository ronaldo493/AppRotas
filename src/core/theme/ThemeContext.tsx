import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {appLogger} from '../../shared/logging/appLogger';

interface ThemeContextData {
  isDarkMode: boolean;
  isThemeLoaded: boolean;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextData | undefined>(
  undefined,
);

export function ThemeProvider({children}: PropsWithChildren) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');

        if (storedTheme === 'dark') {
          setIsDarkMode(true);
        }

        if (storedTheme === 'light') {
          setIsDarkMode(false);
        }
      } catch (error) {
        appLogger.error('Erro ao carregar o tema:', error);
      } finally {
        setIsThemeLoaded(true);
      }
    };

    void loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newTheme = !isDarkMode;

    setIsDarkMode(newTheme);

    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light',);
    } catch (error) {
      // Volta ao tema anterior caso não consiga salvar.
      setIsDarkMode(!newTheme);

      appLogger.error('Erro ao salvar o tema:', error);
    }
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        isThemeLoaded,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useThemeContext deve ser usado dentro do ThemeProvider.',
    );
  }

  return context;
}
