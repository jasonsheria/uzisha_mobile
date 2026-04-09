import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import Preloader from '@/components/Preloader'; // <--- Importe ton composant ici

export default function Index() {
  const router = useRouter();
  const { isSignedIn, loading } = useAuth();

  useEffect(() => {
    // On attend que l'auth soit prête
    if (!loading) {
      // On ajoute un petit délai pour laisser l'animation Uzisha 
      // se dérouler un peu (optionnel, environ 2-3 secondes)
      const timer = setTimeout(() => {
        if (isSignedIn) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 3000); // Laisse le temps à l'utilisateur d'apprécier ton logo

      return () => clearTimeout(timer);
    }
  }, [isSignedIn, loading, router]);

  // ✅ Au lieu de 'return null', on affiche ton Preloader exceptionnel
  if (loading) {
    return <Preloader />;
  }

  // On garde le Preloader affiché aussi pendant le court instant de redirection
  return <Preloader />;
}