import React, { useState } from 'react';
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
import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function LoginScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const { login } = useAuth();
  const { showToast } = useToast();
  const { handleError } = useErrorHandler();

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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cercles décoratifs en arrière-plan */}
        <View style={styles.decorCircle} />

        {/* Header / Logo Section */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#06B6D4', '#0891B2']}
            style={styles.logoBadge}
          >
            <MaterialCommunityIcons name="home-variant" size={40} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>Bon retour !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour gérer vos biens Ndaku</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Email Input */}
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
                placeholder="votre.email@ndaku.cd"
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

          {/* Password Input */}
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
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#06B6D4', '#0E7490']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.gradientBtn}
            >
              <Text style={styles.loginBtnText}>
                {loading ? "Connexion..." : "Se connecter"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Social Logins */}
        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Ou continuer avec</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialIcon}>
              <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <MaterialCommunityIcons name="apple" size={24} color={isDark ? "#FFF" : "#000"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Nouveau sur Ndaku ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#020617' : '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 60,
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
    elevation: 10,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#94A3B8' : '#64748B',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: '#06B6D4',
    backgroundColor: isDark ? '#0F172A' : '#FFF',
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
    fontWeight: '700',
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
    letterSpacing: 0.5,
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
    backgroundColor: isDark ? '#334155' : '#E2E8F0',
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
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  signupLink: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '800',
  }
});