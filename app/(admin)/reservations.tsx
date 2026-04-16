import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  TextInput,
  Platform,
  StatusBar,
  Vibration,
  LayoutAnimation,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import {
  MaterialCommunityIcons,
  Feather,
  Ionicons,
  FontAwesome5,
  Octicons,
  AntDesign,
  Entypo
} from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/components/useColorScheme';
import { useAdmin } from '@/contexts/AdminContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { supabase } from '@/utils/supabase';
import { sendImmediateNotification } from '@/utils/notificationService';
import { useAuthContext } from '@/contexts/AuthContext';
/** * --- 1. CONFIGURATION & THEME --- 
 */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const THEME = {
  colors: {
    primary: '#06B6D4',
    secondary: '#A855F7',
    accent: '#06B6D4',
    success: '#06B6D4',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    dark: {
      bg: '#0F172A',
      card: '#1E293B',
      border: '#334155',
      text: '#F1F5F9',
      subtext: '#94A3B8'
    },
    light: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      border: '#E2E8F0',
      text: '#0F172A',
      subtext: '#64748B'
    }
  }
};

/** * --- 2. TYPES ET INTERFACES --- 
 * Correction du mismatch TypeScript
 */
interface Reservation {
  id: string;
  propertyTitle: string;
  user_id: string;
  property_id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  requestedDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  // Propriétés ajoutées ou calculées
  total_price: number;
  TransactionType: string;
  location?: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
  heure: any;
  check_in: Date;
  check_out: Date;
  guests?: number;
  propertyImage?: string;
  clientAvatar?: string;
}

/** * --- 3. COMPOSANTS DE MICRO-ANIMATION --- 
 */
const AnimatedCard = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 20,
      friction: 7,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: animatedValue,
      transform: [
        { translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
        { scale: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
      ]
    }}>
      {children}
    </Animated.View>
  );
};

/** * --- 4. COMPOSANTS DE L'INTERFACE (WIDGETS) --- 
 */

const HeaderStat = ({ label, value, icon, color, isDark }: any) => (
  <View style={[styles.statWidget, { backgroundColor: isDark ? THEME.colors.dark.card : '#FFF' }]}>
    <LinearGradient
      colors={[color, color + 'CC']}
      style={styles.statIconGradient}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#FFF" />
    </LinearGradient>
    <View>
      <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{label}</Text>
      <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#0F172A' }]}>{value}</Text>
    </View>
  </View>
);

const FilterChip = ({ label, active, onPress, isDark, icon }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      active ? { backgroundColor: THEME.colors.primary } : { backgroundColor: isDark ? '#1E293B' : '#FFF' },
      { borderColor: active ? THEME.colors.primary : isDark ? '#334155' : '#E2E8F0' }
    ]}
  >
    {icon && <Feather name={icon} size={14} color={active ? '#FFF' : '#64748B'} style={{ marginRight: 6 }} />}
    <Text style={[styles.chipText, { color: active ? '#FFF' : isDark ? '#94A3B8' : '#64748B' }]}>{label}</Text>
  </TouchableOpacity>
);

/** * --- 5. ECRAN PRINCIPAL --- 
 */
export default function ReservationsScreen() {
  const { isConnected } = useNetwork();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? THEME.colors.dark : THEME.colors.light;
  // Rafraîchit les réservations à la reconnexion
  React.useEffect(() => {
    if (isConnected && fetchReservations) fetchReservations();
  }, [isConnected]);
  // Accès au contexte
  const { user } = useAuthContext();
  const currentUserId = user?.id; // ID de l'utilisateur connecté
  const [reservation, setReservation] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchReservations = async () => {
    setLoading(true);
    // Requête avec jointure pour récupérer les infos de la propriété et du client
    // récuperer uniquement les reservations dont je suis le propriétaire de la propriété
    const { data, error } = await supabase
      .from('reservations')
      .select(`*,
        property:property_id (id, title, location, image),
        user:user_id (id, name, email, phone, avatar)
      `)
      .eq('property.user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (!error && data) {

      setReservation(data.map((res: any) => ({
        id: res.id,
        user_id: res.user_id,
        property_id: res.property_id,
        propertyTitle: res.property?.title ?? 'Titre inconnu',
        clientName: res.user?.name ?? 'Client inconnu',
        clientEmail: res.user?.email ?? '',
        clientPhone: res.user?.phone ?? '',
        requestedDate: res.check_in,
        heure: res.time_slot,
        status: res.status,
        total_price: res.total_price,
        TransactionType: res.transactionType,
        location: res.property?.location ?? '',
        notes: res.notes,
        propertyImage: res.property?.image ?? '',
        clientAvatar: res.user?.avatar ?? '',
        check_in: res.check_in ? new Date(res.check_in) : new Date(), // Date par défaut si vide
        check_out: res.check_out ? new Date(res.check_out) : new Date(),
      })));
    }
    setLoading(false);
  };
  useEffect(() => {

    fetchReservations();

  }, []);

  // Etats locaux
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // À placer dans un useEffect au lancement de l'application côté client
  useEffect(() => {
    const channel = supabase
      .channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`, // Filtrer pour l'utilisateur connecté
        },
        (payload) => {
          const newNotif = payload.new;
          // DÉCLENCHE LE SON ET LA BANNIÈRE EN TEMPS RÉEL
          sendImmediateNotification(
            newNotif.title,
            newNotif.body,
            'booking' // Canal avec son HIGH importance
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);
  // Animation Modal
  const modalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  // 2. Confirmation avec émission de notification
  // 2. Confirmation avec émission de notification
  const confirmReservation = async (data: Reservation) => {
    try {
      // 1. Mise à jour du statut
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', data.id);

      if (updateError) throw updateError;

      // 2. Préparation des textes
      const isAchat = data.TransactionType === 'achat';
      const notifTitle = isAchat ? 'Achat confirmé ✅' : 'Réservation confirmée ✅';
      const notifBody = `Votre ${isAchat ? 'achat' : 'réservation'} pour "${data.propertyTitle}" a été validé.`;

      // 3. Notification pour l'UTILISATEUR (Via Supabase)
      // Cela déclenchera l'écouteur Realtime sur son téléphone
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([{
          user_id: data.user_id,
          reservation_id: data.id,
          title: notifTitle,
          body: notifBody,
          type: 'booking',
          is_read: false
        }]);

      if (notifError) throw notifError;

      // 4. Notification pour VOUS (Locale & Sonore immédiate)
      // On utilise le channelId 'booking' pour garantir le son
      await sendImmediateNotification(
        'Action effectuée',
        `Vous avez validé le dossier de ${data.clientName}`,
        'booking'
      );

      // 5. Mise à jour UI
      setReservation(prev => prev.map(r => r.id === data.id ? { ...r, status: 'confirmed' } : r));
      Alert.alert("Succès", "Le client a été notifié et le dossier est validé.");

    } catch (error: any) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue.");
    }
  };

  // 3. Annulation avec émission de notification
  const cancelReservation = async (data: Reservation) => {
    try {
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', data.id);

      if (updateError) throw updateError;

      // Insertion notification d'annulation
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: data.user_id,
            reservation_id: data.id,
            title: 'Demande refusée ❌',
            body: `Votre demande pour "${data.propertyTitle}" a été refusée.`,
            type: 'booking',
            is_read: false
          }
        ]);

      if (notifError) console.error("Erreur Notif Annulation:", notifError);

      setReservation(prev => prev.map(r => r.id === data.id ? { ...r, status: 'cancelled' } : r));

    } catch (error) {
      console.error("Erreur annulation:", error);
    }
  };
  // Filtrage
  const filteredData = useMemo(() => {
    return reservation.filter(item => {
      const matchesSearch = item.propertyTitle.toLowerCase().includes(search.toLowerCase()) ||
        item.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' || item.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [reservation, search, activeTab]);

  // Stats dynamiques
  const stats = useMemo(() => {
    const total = reservation.reduce((acc, curr) => acc + curr.total_price, 0);
    const pendingCount = reservation.filter(r => r.status === 'pending').length;
    return { total, pendingCount };
  }, [reservation]);

  // Actions
  const openModal = (res: Reservation) => {
    setSelectedRes(res);
    setIsModalOpen(true);
    Animated.timing(modalY, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalY, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsModalOpen(false));
  };

  const handleAction = (data: Reservation, type: 'confirm' | 'cancel') => {
    Vibration.vibrate(50);
    Alert.alert(
      type === 'confirm' ? "Valider la transaction" : "Refuser la demande",
      "Cette action modifiera le statut définitivement. Continuer ?",
      [
        { text: "Annuler", style: 'cancel' },
        {
          text: "Confirmer",
          onPress: () => {
            // verifier si la date n'est pas encore passée avant de confirmer
            const today = new Date();
            const requestedDate = data.check_in;
            if (type === 'confirm' && requestedDate instanceof Date && requestedDate < today) {
              Alert.alert("Date invalide", "La date demandée est déjà passée veuillez le contacter pour une nouvelle reservation ou commande.");
              // supprimer la reservation expirée
              const deleteExpired = async () => {
                const { error } = await supabase.from('reservations').delete().eq('id', data.id);
              };
              deleteExpired();
              return;
            }
            type === 'confirm' ? confirmReservation(data) : cancelReservation(data);
            closeModal();
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
          }
        }
      ]
    );
  };
  // fonction de formattage de date en date ex Samedi 4 avril 2016

  const dateformate = (dateString: Date) => {
    const date = (dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER & ANALYTICS */}
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Réservations</Text>
            <Text style={styles.subtitle}>Gestion de vos réservations, Achats, et Commandes</Text>
          </View>
          <TouchableOpacity style={[styles.profileBtn, { borderColor: theme.border }]}>
            <Entypo name="dots-three-vertical" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContainer}>
          <HeaderStat icon="cash-multiple" label="Revenu Total" value={`${stats.total}$`} color={THEME.colors.primary} isDark={isDark} />
          <HeaderStat icon="clock-fast" label="En attente" value={stats.pendingCount} color={THEME.colors.warning} isDark={isDark} />
          <HeaderStat icon="check-circle" label="Taux Succès" value="94%" color={THEME.colors.success} isDark={isDark} />
        </ScrollView>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.subtext} />
          <TextInput
            placeholder="Rechercher un client ou un bien..."
            placeholderTextColor={theme.subtext}
            style={[styles.searchInput, { color: theme.text }]}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.chipRow}>
          <FilterChip label="Tous" active={activeTab === 'all'} onPress={() => setActiveTab('all')} isDark={isDark} />
          <FilterChip label="En attente" icon="clock" active={activeTab === 'pending'} onPress={() => setActiveTab('pending')} isDark={isDark} />
          <FilterChip label="Confirmés" icon="check" active={activeTab === 'confirmed'} onPress={() => setActiveTab('confirmed')} isDark={isDark} />
        </View>
      </View>

      {/* LISTE DES RESERVATIONS */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <AnimatedCard index={index}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openModal(item)}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.typeIcon, { backgroundColor: item.TransactionType === 'purchase' ? THEME.colors.accent + '15' : THEME.colors.primary + '15' }]}>
                  <MaterialCommunityIcons
                    name={item.TransactionType === 'purchase' ? "cart" : "calendar-account"}
                    size={22}
                    color={item.TransactionType === 'purchase' ? THEME.colors.accent : THEME.colors.primary}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.propertyTitle, { color: theme.text }]} numberOfLines={1}>{item.propertyTitle}</Text>
                  <Text style={[styles.clientName, { color: theme.subtext }]}>{item.clientName}</Text>
                </View>
                <View style={styles.statusCol}>
                  <Text style={[styles.priceText, { color: theme.text }]}>{item.total_price}$</Text>
                  <View style={[styles.statusIndicator, {
                    backgroundColor:
                      item.status === 'confirmed' ? THEME.colors.success :
                        item.status === 'pending' ? THEME.colors.warning : THEME.colors.danger
                  }]} />
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                <View style={styles.footerInfo}>
                  <Feather name="calendar" size={14} color={theme.subtext} />
                  <Text style={[styles.footerText, { color: theme.subtext }]}>
                    {item.check_out && new Date(item.check_out) < new Date()
                      ? "Date expirée"
                      : item.check_in
                        ? dateformate(item.check_in)
                        : "Date non définie"}
                  </Text>
                </View>
                <View style={styles.footerInfo}>
                  <Feather name="map-pin" size={14} color={theme.subtext} />
                  <Text style={[styles.footerText, { color: theme.subtext }]}>{item.location}</Text>
                </View>
                <AntDesign name="account-book" size={16} color={THEME.colors.primary} />
              </View>
            </TouchableOpacity>
          </AnimatedCard>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search-outline" size={60} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>Aucun résultat trouvé</Text>
          </View>
        }
      />

      {/* MODAL DE DETAILS ANIMEE */}
      <Modal visible={isModalOpen} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          </Pressable>

          <Animated.View style={[
            styles.modalSheet,
            { backgroundColor: theme.card, transform: [{ translateY: modalY }] }
          ]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            {selectedRes && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTag}>{selectedRes.TransactionType === 'purchase' ? 'ACHAT' : 'LOCATION'}</Text>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedRes.propertyTitle}</Text>
                  </View>
                  <View style={[styles.priceBadge, { backgroundColor: THEME.colors.primary }]}>
                    <Text style={styles.priceBadgeText}>{selectedRes.total_price}$</Text>
                  </View>
                </View>

                <View style={[styles.infoSection, { backgroundColor: theme.bg }]}>
                  <InfoRow icon="user" label="Client" value={selectedRes.clientName} isDark={isDark} />
                  <InfoRow icon="mail" label="Email" value={selectedRes.clientEmail} isDark={isDark} />
                  <InfoRow icon="phone" label="Contact" value={selectedRes.clientPhone} isDark={isDark} />
                  <InfoRow icon="map-pin" label="Lieu" value={selectedRes.location} isDark={isDark} />
                  {/* Ajouter la date formatter */}
                  <InfoRow icon="calendar" label="Date de racontre" value={dateformate(selectedRes.check_in)} isDark={isDark} />

                  {/* Ajouter l'heure de racontre */}

                  <InfoRow icon="clock" label="Heure de racontre" value={selectedRes.heure} isDark={isDark} />
                </View>

                <Text style={styles.sectionLabel}>Notes Additionnelles</Text>
                <View style={[styles.noteContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                  <Text style={[styles.noteText, { color: theme.subtext }]}>
                    {selectedRes.notes || "Aucune instruction spécifique n'a été fournie par le client pour cette demande."}
                  </Text>
                </View>

                <View style={styles.timelineSection}>
                  <Text style={styles.sectionLabel}>Statut du Dossier</Text>
                  <View style={styles.statusDisplay}>
                    <View style={[styles.dot, { backgroundColor: selectedRes.status === 'confirmed' ? THEME.colors.success : THEME.colors.warning }]} />
                    <Text style={[styles.statusLabel, { color: selectedRes.status === 'confirmed' ? THEME.colors.success : THEME.colors.warning }]}>
                      {selectedRes.status === 'pending' ? 'EN ATTENTE DE VALIDATION' : 'DOSSIER CONFIRMÉ'}
                    </Text>
                  </View>
                </View>

                {selectedRes.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleAction(selectedRes, 'cancel')}
                      style={[styles.btnAction, { backgroundColor: THEME.colors.danger + '15' }]}
                    >
                      <Text style={[styles.btnActionText, { color: THEME.colors.danger }]}>Refuser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(selectedRes, 'confirm')}
                      style={[styles.btnAction, { backgroundColor: THEME.colors.success }]}
                    >
                      <Text style={[styles.btnActionText, { color: '#FFF' }]}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/** * --- 6. PETITS COMPOSANTS UTILITAIRES --- 
 */
const InfoRow = ({ icon, label, value, isDark }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconBox}>
      <Feather name={icon} size={14} color={THEME.colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#1E293B' }]}>{value}</Text>
    </View>
  </View>
);

/** * --- 7. STYLES --- 
 */
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { padding: 20, paddingBottom: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  profileBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  statsContainer: { gap: 12, paddingRight: 20, paddingVertical: 10 },
  statWidget: { width: 140, padding: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 2, shadowOpacity: 0.05 },
  statIconGradient: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800' },

  searchSection: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 15 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '700' },

  listPadding: { padding: 20, paddingBottom: 100 },
  card: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 16, elevation: 3, shadowOpacity: 0.05 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  typeIcon: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  propertyTitle: { fontSize: 16, fontWeight: '800' },
  clientName: { fontSize: 13, marginTop: 2 },
  statusCol: { alignItems: 'flex-end' },
  priceText: { fontSize: 15, fontWeight: '900' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 15, borderTopWidth: 1 },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 15 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 20, maxHeight: '85%' },
  modalHandle: { width: 50, height: 5, borderRadius: 10, alignSelf: 'center', marginTop: 12 },
  modalContent: { padding: 25 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  modalTag: { fontSize: 12, fontWeight: '900', color: THEME.colors.primary, letterSpacing: 1 },
  modalTitle: { fontSize: 24, fontWeight: '900', marginTop: 5, flex: 1, marginRight: 10 },
  priceBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  priceBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 18 },

  infoSection: { borderRadius: 25, padding: 20, gap: 15, marginBottom: 20 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  infoIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.1)', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '700' },

  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  noteContainer: { padding: 15, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed' },
  noteText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  timelineSection: { marginTop: 25 },
  statusDisplay: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, fontWeight: '900' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 35 },
  btnAction: { flex: 1, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  btnActionText: { fontSize: 16, fontWeight: '800' }
});