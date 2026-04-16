import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// --- Imports de ton projet ---
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuthContext } from '@/contexts/AuthContext';
// Finaliser session OAuth
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);
  // const { } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { updateUser , syncSupabaseSession } = useAuthContext(); // <-- utilise le hook AuthContext
  const { login } = useAuth();
  const { showToast } = useToast();
  const { handleError } = useErrorHandler();
// 1. ÉCOUTEUR CENTRALISÉ (Le seul maître de la redirection)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`--- [AUTH_EVENT] ${event} ---`);
      
      if (session?.user) {
        console.log('[AUTH_EVENT] User trouvé:', session.user.email);
        
        // On prépare l'utilisateur pour le contexte
        const fullUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || 'Utilisateur',
          isFirstTime: false,
        };

        updateUser(fullUser);
        await syncSupabaseSession(); 
        
        // On ne redirige que si on n'est pas déjà sur l'accueil
        router.replace('/(tabs)');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
  // 🔥 GOOGLE LOGIN ULTRA CLEAN
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri({
        scheme: 'uzisha',
        path: 'auth/callback',
      });

      // 🔥 CE LOG VA TE DONNER L'URL EXACTE POUR SUPABASE
      console.log("-----------------------------------------");
      console.log("[SUPABASE CONFIG] Copie cette URL dans 'Redirect URLs' :");
      console.log(redirectTo);
      console.log("-----------------------------------------");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      
      if (result.type === 'success' && result.url) {
        const parsed = new URL(result.url);
        const hash = parsed.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token && refresh_token) {
          console.log("[GOOGLE] Application de la session...");
          await supabase.auth.setSession({ access_token, refresh_token });
          // Pas de redirection ici, le useEffect au-dessus s'en occupe !
        }
      }
    } catch (error) {
      handleError(error, 'Erreur Google');
    } finally {
      setLoading(false);
    }
  };
  // 🔥 AUTO REDIRECT SI CONNECTÉ

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Veuillez remplir tous les champs', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Connexion réussie', 'success', 2000);
      router.replace('/(tabs)');
    } catch (error) {
      handleError(error, 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <SafeAreaView style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={isDark ? "#FFF" : "#1E293B"}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.decorCircle} />

        <View style={styles.header}>
          <LinearGradient
            colors={['#06B6D4', '#0891B2']}
            style={styles.logoBadge}
          >
            <MaterialCommunityIcons name="home-variant" size={40} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour gérer vos biens Uzisha</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Adresse Email</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'email' && styles.inputContainerFocused
            ]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={focusedInput === 'email' ? '#06B6D4' : '#94A3B8'}
              />
              <TextInput
                style={styles.input}
                placeholder="votre.email@uzisha.cd"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[
              styles.inputContainer,
              focusedInput === 'password' && styles.inputContainerFocused
            ]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={focusedInput === 'password' ? '#06B6D4' : '#94A3B8'}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#06B6D4', '#0E7490']}
              style={styles.gradientBtn}
            >
              <Text style={styles.loginBtnText}>
                {loading ? "Connexion..." : "Se connecter"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialIcon}>
              <MaterialCommunityIcons
                name="apple"
                size={24}
                color={isDark ? "#FFF" : "#000"}
              />
            </TouchableOpacity>
          </View> */}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nouveau sur Uzisha ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.skipLoginBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.skipLoginText}>Continuer en tant qu'invité</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#020617' : '#F8FAFC',
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 120,
    paddingBottom: 40,
  },
  decorCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#06B6D410',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#1E293B',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    padding: 20,
    borderRadius: 30,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#94A3B8' : '#64748B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    borderRadius: 15,
    paddingHorizontal: 15,
  },
  inputContainerFocused: {
    borderColor: '#06B6D4',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 15,
    color: isDark ? '#FFF' : '#1E293B',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotText: {
    color: '#06B6D4',
    fontSize: 13,
  },
  loginBtn: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  socialSection: {
    marginTop: 35,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 15,
    color: '#94A3B8',
    fontSize: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  socialIcon: {
    width: 60,
    height: 60,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#64748B',
  },
  signupLink: {
    color: '#06B6D4',
    fontWeight: '800',
  },
  skipLoginBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipLoginText: {
    color: '#94A3B8',
    textDecorationLine: 'underline',
  }
});
