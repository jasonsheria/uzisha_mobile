import React, { createContext, useState, useContext, ReactNode, useRef } from 'react';
import { useColorScheme as useSystemColorScheme, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Ajout de 'system' pour permettre un comportement automatique par défaut
type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  scrollX: Animated.Value;
  scrollY: Animated.Value;
  screenWidth: number;
  screenHeight: number;
  dynamicColor: Animated.AnimatedInterpolation<string | number>; // Type précis
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();

  // État initial sur 'system' ou 'light' selon votre préférence
  const [theme, setThemeState] = useState<ThemeType>('system');

  // Initialisation des valeurs animées (utilisées pour les headers et tab bar)
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const dynamicColor = scrollX.interpolate({
    inputRange: [0, width, width * 2],
    outputRange: ['#0ea5e9', '#d4af37', '#ef4444'], // TECH, LUXURY, SPORT
    extrapolate: 'clamp',
  });
  /**
   * LOGIQUE CORRIGÉE :
   * Si le thème est 'system', on regarde la config du téléphone.
   * Sinon, on regarde uniquement si l'état est 'dark'.
   */
  const isDark = theme === 'system'
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    // Alterne entre clair et sombre (ignore 'system' lors du clic manuel)
    const nextTheme = isDark ? 'light' : 'dark';
    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setTheme,
        dynamicColor,
        scrollX,
        scrollY,
        screenWidth: width,
        screenHeight: height,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};