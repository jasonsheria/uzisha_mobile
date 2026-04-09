import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { BellIcon, UserIcon, SunIcon, MoonIcon } from './Icons';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from './useColorScheme';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');
const HEADER_MAIN_HEIGHT = Platform.OS === 'ios' ? 92 : 115;

export const Header: React.FC<any> = ({ title, subtitle }) => {
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-15)).current;
  const themeRotateAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animation pour le profil (rotation et couleur)
  const profileAnim = useRef(new Animated.Value(user ? 1 : 0)).current;

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const accentColor = '#06B6D4';
  const connectedColor = '#10B981'; // Couleur émeraude quand connecté

  // Animation du thème
  const themeRotate = themeRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const iconScale = iconScaleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 1],
  });

  // Animation du profil : 45deg (déconnecté) -> 0deg (connecté)
  const profileRotation = profileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '0deg'],
  });

  // Animation de l'icône interne pour rester droite
  const iconRotation = profileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-45deg', '0deg'],
  });

  const profileBgColor = profileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [accentColor, connectedColor],
  });

  useEffect(() => {
    // Déclenche l'animation dès que l'état "user" change
    Animated.spring(profileAnim, {
      toValue: user ? 1 : 0,
      useNativeDriver: false, // Color interpolation nécessite false
      friction: 8,
    }).start();
  }, [user]);

  const handleThemeToggle = () => {
    themeRotateAnim.setValue(0);
    iconScaleAnim.setValue(0);
    Animated.parallel([
      Animated.timing(themeRotateAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(iconScaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  };

  const handleProfilePress = () => {
    if (user) {
      router.push('/(admin)');
    } else {
      router.push('/(auth)/login');
    }
  };
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.headerBody, { backgroundColor: bgColor }]}>
        <View style={styles.mainContent}>
          
          <View style={styles.textStack}>
            <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]} numberOfLines={1}>
              {user ? `Karibu ${user.name.split(' ')[0]}` : title}
            </Text>
            <View style={styles.subRow}>
              <View style={[styles.statusDot, { backgroundColor: user ? connectedColor : accentColor }]} />
              <Text style={styles.subtitle}>
                {user ? 'HEWANI •' : (subtitle || 'UZISHA • MTADAO ZA VYASHARA')}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable onPress={handleThemeToggle} style={[styles.actionBtn, { 
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F0F4F8',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.1)'
            }]}>
              <Animated.View style={{ transform: [{ rotate: themeRotate }, { scale: iconScale }], justifyContent: 'center', alignItems: 'center' }}>
                {isDark ? <SunIcon size={18} color="#FBBF24" /> : <MoonIcon size={18} color="#06B6D4" />}
              </Animated.View>
            </Pressable>

            <Pressable 
              onPress={() => router.push('/notifications')}
              style={[styles.actionBtn, { 
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#F0F4F8',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.1)'
              }]}
            >
               <BellIcon size={20} color={isDark ? '#06B6D4' : '#475569'} />
               {unreadCount > 0 && (
                 <View style={[styles.notifBadge, { backgroundColor: '#EF4444' }]} />
               )}
            </Pressable>

            <Pressable onPress={handleProfilePress} style={styles.profileWrapper}>
              {/* Le losange qui devient carré et change de couleur */}
              <Animated.View style={[
                styles.diamondProfile, 
                { 
                  backgroundColor: profileBgColor,
                  transform: [{ rotate: profileRotation }],
                  shadowColor: user ? connectedColor : accentColor,
                  borderRadius: user ? 12 : 8 // Plus arrondi quand connecté
                }
              ]}>
                <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
                  <UserIcon size={20} color="#FFF" />
                </Animated.View>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerBody: {
    height: HEADER_MAIN_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 12,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textStack: {
    flex: 1,
  },
  title: {
    fontSize: 24, // Légèrement réduit pour laisser de la place au nom
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.08)',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileWrapper: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondProfile: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
});