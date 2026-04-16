import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/utils/authService';
import { supabase } from '@/utils/supabase';
import { crossPlatformStorage } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  completeOnboarding: () => Promise<void>;
  syncSupabaseSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Écouter les changements d'état d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            // Récupérer les données complètes de l'utilisateur
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              await crossPlatformStorage.setItem(
                'auth_user',
                crossPlatformStorage.safeStringify(currentUser)
              );
            }
          } else {
            setUser(null);
            await crossPlatformStorage.removeItem('auth_user');
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: authenticatedUser, token } = await authService.login({
        email,
        password,
      });

      setUser(authenticatedUser);
    } catch (error) {
      throw error;
    }
  };
  const syncSupabaseSession = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.session.user.id)
      .maybeSingle();

    if (userError) throw userError;

    const authenticatedUser = userData || {
      id: data.session.user.id,
      email: data.session.user.email || '',
      name: data.session.user.user_metadata?.full_name || 'Utilisateur',
      isFirstTime: true,
    };

    // On utilise directement le setUser du Provider
    setUser(authenticatedUser);
    
    // On sauvegarde en local pour persister
    await crossPlatformStorage.setItem(
      'auth_user', 
      crossPlatformStorage.safeStringify(authenticatedUser)
    );
  } catch (error) {
    console.error('Erreur de sync Supabase session', error);
  }
};
  const signup = async (email: string, name: string, password: string) => {
    try {
      const { user: newUser, token } = await authService.signup({
        email,
        name,
        password,
      });

      setUser(newUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      await crossPlatformStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    crossPlatformStorage.setItem('auth_user', crossPlatformStorage.safeStringify(updatedUser));
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      await authService.completeOnboarding(user.id);
      const updatedUser = { ...user, isFirstTime: false };
      setUser(updatedUser);
      await crossPlatformStorage.setItem('auth_user', crossPlatformStorage.safeStringify(updatedUser));
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSignedIn: !!user,
        login,
        signup,
        logout,
        updateUser,
        completeOnboarding,
        syncSupabaseSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
