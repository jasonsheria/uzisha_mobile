import { Platform } from 'react-native';

/**
 * Adaptateur de stockage cross-platform
 * Fonctionne sur Expo Go (web) et plateformes natives
 */
export const crossPlatformStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      }
      // Pour les plateformes natives (à améliorer avec AsyncStorage)
      return null;
    } catch (error) {
      console.error(`Storage getItem error for key "${key}":`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      }
      // Pour les plateformes natives
    } catch (error) {
      console.error(`Storage setItem error for key "${key}":`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      }
      // Pour les plateformes natives
    } catch (error) {
      console.error(`Storage removeItem error for key "${key}":`, error);
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
        }
      }
      // Pour les plateformes natives
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  },

  /**
   * Aide à sérialiser les objets en évitant les Symbols
   */
  safeStringify: (obj: any): string => {
    try {
      return JSON.stringify(obj, (key, value) => {
        // Ignorer les Symbol et les fonctions
        if (typeof value === 'symbol' || typeof value === 'function') {
          return undefined;
        }
        return value;
      });
    } catch (error) {
      console.error('Safe stringify error:', error);
      return JSON.stringify({});
    }
  },

  /**
   * Aide à parser les objets stockés
   */
  safeParse: (jsonString: string): any => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Safe parse error:', error);
      return null;
    }
  },
};
