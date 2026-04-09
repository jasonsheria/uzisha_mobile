import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook personnalisé pour accéder au contexte d'authentification
 * Utilise le contexte global AuthProvider
 */
export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    loading: context.loading,
    isSignedIn: context.isSignedIn,
    login: context.login,
    signup: context.signup,
    logout: context.logout,
    updateUser: context.updateUser,
    completeOnboarding: context.completeOnboarding,
  };
}

