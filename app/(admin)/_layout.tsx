import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Slot, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { AdminProvider } from '@/contexts/AdminContext';
import { useAuth } from '@/hooks/useAuth';
import AdminDrawerContent from './drawer';
import { BlurView } from 'expo-blur'; // Optionnel: pour un effet premium sur iOS
import { DynamicIcon } from '@/components/DynamicIcon';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants';
const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Platform.OS === 'web' ? 280 : width * 0.75;

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(Platform.OS === 'web');
  const drawerAnim = React.useRef(new Animated.Value(Platform.OS === 'web' ? 0 : -DRAWER_WIDTH)).current;
  const { theme, isDark, dynamicColor } = useTheme();
  // Couleurs dynamiques
  const colors = {
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    primary: '#06B6D4',
    text: isDark ? '#F1F5F9' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/(auth)/login');
  }, [user, loading]);

  useEffect(() => {
    Animated.spring(drawerAnim, {
      toValue: drawerOpen ? 0 : -DRAWER_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [drawerOpen]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <AdminProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Overlay optimisé */}
        {drawerOpen && Platform.OS !== 'web' && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.overlay}
            onPress={() => setDrawerOpen(false)}
          >
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: 0.4 }]} />
          </TouchableOpacity>
        )}

        <View style={[styles.container, { flexDirection: Platform.OS === 'web' ? 'row' : 'column' }]}>

          {/* Sidebar avec ombre portée sur mobile */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: drawerAnim }],
                backgroundColor: colors.card,
                borderRightColor: colors.border,
                elevation: drawerOpen ? 20 : 0,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 15,
              },
            ]}
          >
            <AdminDrawerContent />
          </Animated.View>

          <View style={styles.content}>
            {/* Header Mobile Style Premium */}
            {Platform.OS !== 'web' && (
              <View style={[styles.mobileHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>

                <TouchableOpacity
                  onPress={() => setDrawerOpen(!drawerOpen)}
                  style={[styles.hamburger, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(17, 19, 137, 0.05)' }]}
                >
                  <MaterialCommunityIcons
                    name={drawerOpen ? 'chevron-left' : 'menu'} // 'menu' est standard et toujours disponible
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                  <Text style={styles.headerSubtitle}>Espace Admin</Text>
                  <Text style={styles.headerTitleText}>Bienvenue, {user.name}</Text>
                </View>
                {/* Ajouter le bouton de notification */}
                <TouchableOpacity style={styles.NotificationButton} onPress={() => router.push('/notifications')}>
                  <MaterialCommunityIcons name="bell-outline" size={24} color={'#06B6D4'} />
                </TouchableOpacity>
 
              </View>



            )}

            <View style={{ flex: 1 }}>
              <Slot />
            </View>
          </View>
        </View>
      </View>
    </AdminProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  drawerContainer: {
    borderRightWidth: 1,
    height: '100%',
    zIndex: 1000,
    ...Platform.select({
      native: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
      }
    })
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  content: {
    flex: 1,
  },
  mobileHeader: {
    height: 120,
    paddingTop: 40, // Adaptation pour encoche
    paddingHorizontal: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  hamburger: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
   
    zIndex: 1100,
  },
  headerTitle: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitleText: { 
    fontSize: 17,
    fontWeight: '700',
    color : "#94A3B8"
  },
  profileButton: {
    marginLeft: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  NotificationButton: {

    marginLeft: 'auto',
     padding: 8,
     borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
  }
});