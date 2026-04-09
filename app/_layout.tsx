import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

// Imports de tes composants et contextes
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { useForceUpdateCheck } from '@/utils/useForceUpdateCheck';
import Preloader from '@/components/Preloader';
import NoConnectionScreen from '@/components/NoConnectionScreen';
import ForceUpdateScreen from '@/components/ForceUpdateScreen';

export { ErrorBoundary } from 'expo-router';
import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');
SplashScreen.preventAutoHideAsync();
export const linking = {
  prefixes: [prefix, 'https://uzisha.com', 'uzisha://'],
  config: {
    screens: {
      // Assurez-vous que les noms correspondent à vos fichiers dans /app
      index: 'home',
      '(tabs)': {
        screens: {
          explore: 'explore',
        },
      },
      'boutique/[id]': 'boutique/:id',
      'property/[id]': 'property/:id',
    },
  },
};
export default function RootLayout() {
  const [isConnected, setIsConnected] = useState(true);
  const { isBlocked, message, obsoleteDate } = useForceUpdateCheck();
  
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // --- LOGIQUE DE CONNEXION ---
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('https://clients3.google.com/generate_204');
        setIsConnected(res.status === 204);
      } catch {
        setIsConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000); 
    return () => clearInterval(interval);
  }, []);

  // --- GESTION DES ERREURS DE POLICE ---
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // --- STRUCTURE DES PROVIDERS ---
  // On place les Providers tout en haut pour qu'ils soient accessibles partout
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <NotificationProvider>
             <ContentGuard 
                loaded={loaded} 
                isConnected={isConnected} 
                isBlocked={isBlocked} 
                message={message} 
                obsoleteDate={obsoleteDate} 
             />
          </NotificationProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// --- COMPOSANT DE CONTRÔLE D'ACCÈS (GUARDS) ---
function ContentGuard({ loaded, isConnected, isBlocked, message, obsoleteDate }: any) {
  const { loading } = useAuth(); // Maintenant utilisable car dans AuthProvider
  const colorScheme = useColorScheme();

  // 1. Attente du chargement des ressources (Fonts + Auth Session)
  if (!loaded || loading) {
    return <Preloader />;
  }

  // 2. Vérification de la connexion
  if (!isConnected) {
    return <NoConnectionScreen />;
  }

  // 3. Vérification de la mise à jour forcée
  if (isBlocked) {
    return <ForceUpdateScreen message={message} obsoleteDate={obsoleteDate} />;
  }

  // 4. Si tout est OK, on affiche la navigation
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        {/* Ajoute d'autres Stack.Screen si nécessaire */}
      </Stack>
    </NavigationThemeProvider>
  );
}