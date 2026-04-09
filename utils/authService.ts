import { supabase } from '@/utils/supabase';
import { User } from '@/types';
import { navigate } from 'expo-router/build/global-state/routing';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  name: string;
  password: string;
}

export const authService = {
  /**
   * INSCRIPTION : Utilise le Trigger SQL de Supabase
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      // 1. Inscription dans auth.users
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.name }, // Lu par le trigger SQL
        },
      });

      if (signupError) throw signupError;
      if (!authData.user) throw new Error('Échec de la création du compte auth.');

      // 2. PAUSE : Laisse le temps au trigger SQL de créer la ligne dans public.users
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. RÉCUPÉRATION DIRECTE : On cherche le profil créé par le trigger
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userData) {
        throw new Error("Compte créé, mais le profil n'est pas encore prêt. Essayez de vous connecter.");
      }

      return {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar,
          isFirstTime: userData.is_first_time,
        },
        token: authData.session?.access_token || '',
      };
    } catch (error) {
      console.error('Signup logic error:', error);
      throw error;
    }
  },

  /**
   * CONNEXION
   */
 async login(data: LoginData): Promise<AuthResponse> {
  try {
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (loginError) throw loginError;
    if (!authData.user || !authData.session) throw new Error('Session introuvable.');

    // Remplacer .single() par .maybeSingle() pour éviter le crash PGRST116
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle(); 

    if (userError) throw userError;

    // Si le profil n'existe pas encore (cas rare mais possible)
    if (!userData) {
       console.warn("Profil manquant dans la table public.users");
       // On retourne un objet utilisateur basique basé sur Auth
       return {
         user: {
           id: authData.user.id,
           email: authData.user.email || '',
           name: authData.user.user_metadata?.full_name || 'Utilisateur',
           isFirstTime: true,
         },
         token: authData.session.access_token,
       };
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        avatar: userData.avatar,
        isFirstTime: userData.is_first_time,
      },
      token: authData.session.access_token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
},

  /**
   * RÉCUPÉRER L'UTILISATEUR ACTUEL (Via session persistante)
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) return null;

      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (dbError || !userData) return null;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        avatar: userData.avatar,
        isFirstTime: userData.is_first_time,
      };
    } catch (error) {
      return null;
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    return navigate('/(tabs)');
  },

  async completeOnboarding(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_first_time: false, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /**
   * Mettre à jour le profil utilisateur (nom, avatar)
   */
  async updateUserProfile(userId: string, updates: { name?: string; avatar?: string }): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error || !data) throw error || new Error('Erreur lors de la mise à jour du profil');
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        avatar: data.avatar,
        isFirstTime: data.is_first_time,
      };
    } catch (error) {
      console.error('[Update Profile Error]:', error);
      return null;
    }
  },
};