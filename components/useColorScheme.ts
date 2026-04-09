import { useColorScheme as useColorSchemeCore } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const useColorScheme = () => {
  try {
    // Try to use our custom Theme context
    const { isDark } = useTheme();
    return isDark ? 'dark' : 'light';
  } catch {
    // Fallback to system color scheme if context is not available
    const coreScheme = useColorSchemeCore();
    return coreScheme === 'unspecified' ? 'light' : coreScheme;
  }
};

