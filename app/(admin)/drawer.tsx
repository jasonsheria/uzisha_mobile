import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth'; // Hook d'authentification
import { supabase } from '@/utils/supabase'; // Client Supabase
import { MotiView } from 'moti'; // Pour les animations fluides

export default function AdminDrawerContent() {
  const isDark = useColorScheme() === 'dark';
  const { user, logout } = useAuth(); // Récupération de l'utilisateur réel
  const [activeMenu, setActiveMenu] = useState('articles');
  
  // États pour les compteurs réels provenant de la DB
  const [stats, setStats] = useState({
    annonces: '0',
    reservations: '0',
  });

  const theme = {
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#F1F5F9' : '#0F172A',
    subText: isDark ? '#94A3B8' : '#64748B',
    primary: '#06B6D4',
    accent: '#10B981',
    border: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  };

  // 1. Chargement des statistiques réelles depuis Supabase
  useEffect(() => {
    async function fetchAdminStats() {
      if (!user?.id) return;

      try {
        // Compte les annonces (propriétés) appartenant à cet utilisateur
        const { count: countAnnonces, error: err1 } = await supabase
          .from('properties') 
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        // Compte les réservations liées aux biens de cet utilisateur
        const { count: countRes, error: err2 } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id);

        if (!err1 && !err2) {
          setStats({
            annonces: String(countAnnonces || 0),
            reservations: String(countRes || 0),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des stats admin:", error);
      }
    }

    fetchAdminStats();
  }, [user]);

  // 2. Fonction de déconnexion sécurisée
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert("Erreur", "La déconnexion a échoué.");
    }
  };

  const menuItems = [
    { id: 'articles', label: 'Mes Annonces', icon: 'home-city-outline', activeIcon: 'home-city', href: '/(admin)/articles', badge: stats.annonces },
    { id: 'reservations', label: 'Réservations', icon: 'calendar-check-outline', activeIcon: 'calendar-check', href: '/(admin)/reservations', badge: stats.reservations },
    { id: 'calendar', label: 'Disponibilités', icon: 'calendar-month-outline', activeIcon: 'calendar-month', href: '/(admin)/calendar' },
    { id: 'subscription', label: 'Mon Abonnement', icon: 'credit-card-outline', activeIcon: 'credit-card', href: '/(admin)/subscription', badge: 'Pro' },
    { id: 'boutique', label: 'E-boutique', icon: 'shopping-cart', activeIcon: 'shopping-cart-outline', href: '/(admin)/boutique' },
    { id: 'profile', label: 'Configuration', icon: 'cog-outline', activeIcon: 'cog', href: '/(admin)/profile' },
    { id: 'home', label: 'Page d`\acceuille', icon: 'home', activeIcon: 'home-outline', href: '/(tabs)/' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      
      {/* 1. Profile Header - Données Utilisateur Réelles */}
      <View style={styles.headerPremium}>
        <View style={styles.profileWrapper}>
          <View style={[styles.avatarBorder, { borderColor: theme.primary }]}>
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                style={styles.avatarImg} 
              />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900' }}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.statusPulse}>
            <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          </View>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {user?.name || 'Administrateur'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>COMPTE PRO</Text>
          </View>
        </View>
      </View>

      {/* 2. Scrollable Menu */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>Gestion Immobilière</Text>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const isActive = activeMenu === item.id;
            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: index * 100 }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.menuItem,
                    isActive && { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.06)' }
                  ]}
                  onPress={() => {
                    setActiveMenu(item.id);
                    router.push(item.href as any);
                  }}
                >
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
                  
                  <View style={[styles.iconBox, isActive && { backgroundColor: theme.primary }]}>
                    <MaterialCommunityIcons
                      name={(isActive ? item.activeIcon : item.icon) as any}
                      size={22}
                      color={isActive ? '#FFF' : theme.subText}
                    />
                  </View>
                  
                  <Text style={[styles.menuLabel, { color: isActive ? theme.primary : theme.subText, fontWeight: isActive ? '800' : '600' }]}>
                    {item.label}
                  </Text>

                  {item.badge && item.badge !== '0' && (
                    <View style={[styles.badgeContainer, { backgroundColor: item.badge === 'Pro' ? theme.accent : '#F43F5E' }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>
      </ScrollView>

      {/* 3. Footer - Support & Logout Réel */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity 
            style={[styles.supportCard, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(admin)')}
        >
          <View style={styles.supportIcon}>
            <MaterialCommunityIcons name="headphones" size={20} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.supportText, { color: theme.text }]}>Support Client</Text>
            <Text style={[styles.supportSub, { color: theme.subText }]}>Disponible 24h/7j</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.subText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="power" size={20} color="#F43F5E" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
  headerPremium: {
    marginTop : 40,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
  },
  profileWrapper: { position: 'relative' },
  avatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 16 },
  statusPulse: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 2,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  roleBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: { color: '#06B6D4', fontSize: 10, fontWeight: '800' },

  // Menu
  menuScroll: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 25,
    marginBottom: 15,
  },
  menuContainer: { paddingHorizontal: 15 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    height: '60%',
    width: 4,
    borderRadius: 2,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'transparent',
  },
  menuLabel: { flex: 1, fontSize: 15 },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  // Footer
  footer: { padding: 20, borderTopWidth: 1 },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportText: { fontSize: 14, fontWeight: '700' },
  supportSub: { fontSize: 11 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  logoutText: { color: '#F43F5E', fontWeight: '800', fontSize: 15 },
});