import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/utils/supabase';
import * as ImagePicker from 'expo-image-picker'; // Assurez-vous d'avoir installé expo-image-picker

const { width, height } = Dimensions.get('window');

interface MenuItemProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  isDark: boolean;
  rightElement?: React.ReactNode;
}

const MenuItem = ({ icon, label, color, onPress, isDark, rightElement }: MenuItemProps) => (
  <TouchableOpacity 
    style={[styles.menuItem, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor: isDark ? '#334155' : '#F1F5F9' }]} 
    activeOpacity={0.7}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={[styles.menuIconBg, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.menuLabel, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>{label}</Text>
    {rightElement ? rightElement : <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuth();

  // États
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState({ properties: 0, reservations: 0, rating: '4.8' });
  
  // États pour la Certification KYC
  const [isKYCModalVisible, setIsKYCModalVisible] = useState(false);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const { count: propCount } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('owner_id', user.id);
      const { count: resCount } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      setStats({ properties: propCount || 0, reservations: resCount || 0, rating: '4.9' });
    } catch (error) { console.error(error); }
  };

  useFocusEffect(useCallback(() => { fetchUserStats(); setIsLoggingOut(false); }, [user]));

  const pickIdCard = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setIdImage(result.assets[0].uri);
    }
  };

  const handleCertificationRequest = async () => {
    if (!idImage) {
      Alert.alert("Erreur", "Veuillez importer votre pièce d'identité.");
      return;
    }

    setIsVerifying(true);

    // Simulation du KYC automatique (3 secondes)
    setTimeout(async () => {
      try {
        // Logique d'envoi vers Supabase
        const { error } = await supabase
          .from('verification_requests')
          .insert([
            { user_id: user?.id, id_url: idImage, status: 'pending', created_at: new Date() }
          ]);

        if (error) throw error;

        setIsVerifying(false);
        setIsKYCModalVisible(false);
        setIdImage(null);
        Alert.alert("Demande envoyée", "Votre pièce d'identité est en cours d'examen. Vous recevrez une notification une fois validée.");
      } catch (error) {
        setIsVerifying(false);
        Alert.alert("Erreur", "Une erreur est survenue lors de l'envoi.");
      }
    }, 3000);
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Quitter Ndaku ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: async () => {
          setIsLoggingOut(true);
          try { await logout(); router.replace('/(auth)/login'); } 
          catch (e) { setIsLoggingOut(false); }
      }}
    ]);
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Utilisateur';
  const displayEmail = user?.email || 'ndaku@service.com';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <StatusBar barStyle="light-content" translucent />

      {isLoggingOut && (
        <View style={[styles.logoutOverlay, { backgroundColor: isDark ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.9)' }]}>
          <ActivityIndicator size="large" color="#06B6D4" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header avec Stats */}
        <View style={styles.fullHeader}>
          <LinearGradient colors={isDark ? ['#0891B2', '#164E63', '#0F172A'] : ['#06B6D4', '#0891B2', '#0E7490']} style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarMain}>
                  {user?.avatar ? <Image source={{ uri: user.avatar }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{displayInitial}</Text>}
                </View>
              </View>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{displayEmail}</Text>
              <View style={styles.proBadge}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#FFF" />
                <Text style={styles.proText}>MEMBRE VÉRIFIÉ</Text>
              </View>
            </View>

            <View style={[styles.statsFloatingCard, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
              <View style={styles.statItem}><Text style={[styles.statVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{stats.properties}</Text><Text style={styles.statLab}>Annonces</Text></View>
              <View style={[styles.statSep, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} />
              <View style={styles.statItem}><Text style={[styles.statVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{stats.reservations}</Text><Text style={styles.statLab}>Réserv.</Text></View>
              <View style={[styles.statSep, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} />
              <View style={styles.statItem}><Text style={[styles.statVal, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{stats.rating}</Text><Text style={styles.statLab}>Note</Text></View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>Gestion Immobilière</Text>
          <MenuItem icon="home-group" label="Mes Annonces Ndaku" color="#06B6D4" isDark={isDark} onPress={() => router.push('/(admin)/articles')} />
          <MenuItem icon="calendar-check" label="Mes Réservations" color="#F59E0B" isDark={isDark} onPress={() => router.push('/reservations')} />
          <MenuItem icon="wallet-outline" label="Paiements & Factures" color="#10B981" isDark={isDark} onPress={() => router.push('/(admin)/subscription')} />

          <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B', marginTop: 25 }]}>Sécurité & Compte</Text>
          
          {/* NOUVELLE OPTION : DEMANDE DE CERTIFICATION */}
          <MenuItem 
            icon="shield-account-outline" 
            label="Demander la Certification" 
            color="#06B6D4" 
            isDark={isDark} 
            onPress={() => setIsKYCModalVisible(true)} 
          />

          <MenuItem icon="account-edit-outline" label="Modifier le profil" color="#06B6D4" isDark={isDark} onPress={() => router.push('/(admin)/profile')} />
          
          <MenuItem 
            icon="bell-outline" label="Notifications Push" color="#EC4899" isDark={isDark} 
            rightElement={<Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} thumbColor={notificationsEnabled ? "#06B6D4" : "#f4f3f4"} trackColor={{ false: "#CBD5E1", true: "#A5F3FC" }}/>}
          />

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
            <MaterialCommunityIcons name="logout-variant" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL KYC - CERTIFICATION */}
      <Modal visible={isKYCModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>Certification de compte</Text>
              <TouchableOpacity onPress={() => setIsKYCModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={isDark ? '#94A3B8' : '#64748B'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Pour obtenir le badge vérifié, importez une photo claire de votre carte d'identité ou passeport.
            </Text>

            <TouchableOpacity style={[styles.uploadArea, { borderColor: isDark ? '#334155' : '#E2E8F0' }]} onPress={pickIdCard}>
              {idImage ? (
                <Image source={{ uri: idImage }} style={styles.previewImage} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons name="cloud-upload" size={40} color="#06B6D4" />
                  <Text style={{ color: '#06B6D4', marginTop: 8, fontWeight: '600' }}>Importer la pièce</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.verifyBtn, { opacity: idImage && !isVerifying ? 1 : 0.6 }]} 
              onPress={handleCertificationRequest}
              disabled={!idImage || isVerifying}
            >
              {isVerifying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Lancer la vérification KYC</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoutOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  fullHeader: { width: width, height: 350 },
  headerGradient: { flex: 1, paddingTop: 70, alignItems: 'center', borderBottomLeftRadius: 45, borderBottomRightRadius: 45 },
  headerContent: { alignItems: 'center', zIndex: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatarMain: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 42, fontWeight: '900', color: '#06B6D4' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  userEmail: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  proBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15 },
  proText: { color: '#FFF', fontSize: 10, fontWeight: '800', marginLeft: 5 },
  statsFloatingCard: { position: 'absolute', bottom: -35, flexDirection: 'row', width: width * 0.88, borderRadius: 25, padding: 22, justifyContent: 'space-around', elevation: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: 'bold' },
  statLab: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statSep: { width: 1, height: '80%', alignSelf: 'center' },
  menuSection: { marginTop: 65, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1.2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  menuIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 35, backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 16, marginLeft: 10 },
  footerBrand: { textAlign: 'center', color: '#94A3B8', fontSize: 11, marginTop: 25 },
  
  // Styles Modal KYC
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSub: { fontSize: 14, marginBottom: 25, lineHeight: 20 },
  uploadArea: { height: 200, borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 30, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  verifyBtn: { backgroundColor: '#06B6D4', padding: 18, borderRadius: 15, alignItems: 'center' },
  verifyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});