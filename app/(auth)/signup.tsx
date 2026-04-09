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

export default function SignupScreen() {
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const { signup } = useAuth();
  const { showToast } = useToast();
  const { handleError } = useErrorHandler();

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showToast('Veuillez remplir tous les champs', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'warning');
      return;
    }
    if (password.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'warning');
      return;
    }

    setLoading(true);
    try {
      await signup(email, name, password);
      showToast('Inscription réussie!', 'success', 2000);
      router.replace('/onboarding');
    } catch (error) {
      handleError(error, "Erreur lors de l'inscription");
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
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={isDark ? '#FFF' : '#1E293B'} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoignez Ndaku et trouvez votre prochain chez-vous</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          
          {/* Full Name */}
          <InputGroup 
            label="Nom complet"
            icon="account-outline"
            placeholder="Ex: Patient Ndaku"
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedInput('name')}
            isFocused={focusedInput === 'name'}
            isDark={isDark}
            styles={styles}
          />

          {/* Email */}
          <InputGroup 
            label="Adresse Email"
            icon="email-outline"
            placeholder="votre@email.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedInput('email')}
            isFocused={focusedInput === 'email'}
            isDark={isDark}
            styles={styles}
          />

          {/* Password */}
          <InputGroup 
            label="Mot de passe"
            icon="lock-outline"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedInput('password')}
            isFocused={focusedInput === 'password'}
            isDark={isDark}
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            styles={styles}
          />

          {/* Confirm Password */}
          <InputGroup 
            label="Confirmer le mot de passe"
            icon="lock-check-outline"
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onFocus={() => setFocusedInput('confirm')}
            isFocused={focusedInput === 'confirm'}
            isDark={isDark}
            styles={styles}
          />

          {/* Terms (UX Hint) */}
          <Text style={styles.termsText}>
            En s'inscrivant, vous acceptez nos <Text style={styles.termsLink}>Conditions d'utilisation</Text>
          </Text>

          {/* Signup Button */}
          <TouchableOpacity 
            style={styles.signupBtn}
            onPress={handleSignup}
            disabled={loading}
          >
            <LinearGradient
              colors={['#06B6D4', '#0E7490']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.gradientBtn}
            >
              <Text style={styles.signupBtnText}>
                {loading ? "Création..." : "S'inscrire"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Déjà membre ? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Composant Interne pour les champs (DRY - Don't Repeat Yourself)
const InputGroup = ({ label, icon, isFocused, isDark, rightIcon, onRightIconPress, styles, ...props }: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
      <MaterialCommunityIcons name={icon} size={20} color={isFocused ? '#06B6D4' : '#94A3B8'} />
      <TextInput 
        style={styles.input} 
        placeholderTextColor="#94A3B8"
        onBlur={() => props.onFocus(null)}
        {...props} 
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress}>
          <MaterialCommunityIcons name={rightIcon} size={20} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#020617' : '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: isDark ? '#94A3B8' : '#64748B',
    marginBottom: 6,
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
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: isDark ? '#FFF' : '#1E293B',
  },
  termsText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 15,
  },
  termsLink: {
    color: '#06B6D4',
    fontWeight: 'bold',
  },
  signupBtn: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signupBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLink: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '800',
  }
});