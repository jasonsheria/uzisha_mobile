import { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallback() {
  useEffect(() => {
    const handleOAuth = async () => {
      try {
        // Récupérer l'URL de la page de callback
        const url = window?.location?.href || '';

        if (!url) {
          router.replace('/(auth)/login');
          return;
        }

        // 🔹 Extraire les tokens du hash
        const parsed = new URL(url);
        const hash = parsed.hash.substring(1); // remove #
        const params = new URLSearchParams(hash);

        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          // 🔹 Set session
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
        }

        // 🔹 Rediriger vers l'app principale
        router.replace('/(tabs)');
      } catch (error) {
        console.log('Erreur callback OAuth:', error);
        router.replace('/(auth)/login');
      }
    };

    handleOAuth();
  }, []);

  return null;
}