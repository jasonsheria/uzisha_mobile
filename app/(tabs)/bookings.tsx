import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  LayoutAnimation,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// --- TYPES & INTERFACES ---
type BookingStatus = 'pending' | 'confirmed' | 'expired' | 'completed' | 'cancelled';
type TransactionType = 'achat' | 'commande' | 'reservation' | 'all';

interface OwnerProfile {
  id: string;
  name: string;
  phone: string;
  avatar_url: string;
}

interface PropertyData {
  id: string;
  title: string;
  location: string;
  images: string[];
  owner_id: string;
  users: OwnerProfile; // Jointure avec le propriétaire
}

interface NdakuBooking {
  id: string;
  property_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: BookingStatus;
  notes: string;
  transactionType: TransactionType;
  created_at: string;
  properties: PropertyData; // Données jointes de la propriété
}

// --- CONSTANTS ---
const CATEGORIES: { label: string; value: TransactionType; icon: any }[] = [
  { label: 'Tous', value: 'all', icon: 'layers-outline' },
  { label: 'Achats', value: 'achat', icon: 'calendar-search' },
  { label: 'Visites', value: 'reservation', icon: 'home-city-outline' },
  { label: 'Resto', value: 'commande', icon: 'silverware-variant' },
];

export default function BookingsScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  // States
  const [bookings, setBookings] = useState<NdakuBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TransactionType>('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- LOGIQUE SUPABASE ---
  const fetchBookings = async (userId: string, quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          properties:property_id (
            id,
            title,
            location,
            images,
            user_id,
            users!user_id (
              id,
              name,
              phone
            )
          )
        `) // On a retiré avatar_url ici pour éviter l'erreur 42703
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setBookings(data as any[]);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.error("Erreur de récupération Supabase:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (user?.id) {
      fetchBookings(user.id);
    }
  }, [user?.id]);

  const onRefresh = () => {
    if (user?.id) {
      setRefreshing(true);
      fetchBookings(user.id, true);
    }
  };

  // --- FILTRAGE ---
  const filteredBookings = useMemo(() => {
    if (activeFilter === 'all') return bookings;
    return bookings.filter(b => b.transactionType === activeFilter);
  }, [bookings, activeFilter]);

  const handleFilterChange = (filter: TransactionType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(filter);
  };

  // --- UI HELPERS ---
  const getTypeUI = (type: string) => {
    switch (type) {
      case 'achat':
        return { icon: 'home-shield', color: '#10B981', label: 'ACHAT IMMO', bg: '#DCFCE7' };
      case 'commande':
        return { icon: 'moped', color: '#EC4899', label: 'RESTAURANT', bg: '#FCE7F3' };
      case 'reservation':
        return { icon: 'calendar-clock', color: '#06B6D4', label: 'VISITE IMMO', bg: '#CFFAFE' };
      default:
        return { icon: 'tag', color: '#64748B', label: 'ACTIVITÉ', bg: '#F1F5F9' };
    }
  };

  const getStatusUI = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed': return { label: 'Confirmé', color: '#10B981', icon: 'check-decagram' };
      case 'pending': return { label: 'En attente', color: '#F59E0B', icon: 'clock-outline' };
      case 'expired': return { label: 'Expiré', color: '#EF4444', icon: 'alert-circle' };
      case 'completed': return { label: 'Terminé', color: '#6366F1', icon: 'flag-checkered' };
      case 'cancelled': return { label: 'Annulé', color: '#94A3B8', icon: 'close-circle' };
      default: return { label: 'Inconnu', color: '#64748B', icon: 'help-circle' };
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  // --- RENDER COMPONENTS ---

  const renderHeader = () => {
    const headerHeight = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -10],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerHeight }] }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Mes Activités</Text>
            <Text style={styles.headerSubtitle}>
              {bookings.length} réservation{bookings.length > 1 ? 's' : ''} au total
            </Text>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${user?.email}&background=06B6D4&color=fff` }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              onPress={() => handleFilterChange(cat.value)}
              style={[
                styles.filterTab,
                activeFilter === cat.value && styles.filterTabActive
              ]}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={18}
                color={activeFilter === cat.value ? '#FFF' : '#64748B'}
              />
              <Text style={[
                styles.filterTabText,
                activeFilter === cat.value && styles.filterTabTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={50} color={isDark ? '#334155' : '#CBD5E1'} />
      </View>
      <Text style={styles.emptyTitle}>Aucune activité</Text>
      <Text style={styles.emptyText}>
        {activeFilter === 'all'
          ? "Vous n'avez pas encore de réservations ou d'achats enregistrés."
          : `Aucun historique trouvé pour la catégorie "${activeFilter}".`}
      </Text>
      <TouchableOpacity style={styles.exploreBtn} onPress={() => onRefresh()}>
        <Text style={styles.exploreBtnText}>Actualiser la liste</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBookingCard = (item: NdakuBooking, index: number) => {
    const typeUI = getTypeUI(item.transactionType);
    const statusUI = getStatusUI(item.status);
    const property = item.properties;
    const owner = property?.users;

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity style={styles.card} activeOpacity={0.98}>
          {/* IMAGE SECTION */}
          <View style={styles.imageSection}>
            <Image
              source={{ uri: property?.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800' }}
              style={styles.cardImage}
            />
            <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.topGradient} />

            <View style={styles.cardBadgesRow}>
              <BlurView intensity={30} tint="dark" style={styles.typeBadgeBlur}>
                <MaterialCommunityIcons name={typeUI.icon as any} size={14} color={typeUI.color} />
                <Text style={[styles.typeBadgeText, { color: typeUI.color }]}>{typeUI.label}</Text>
              </BlurView>

              <View style={[styles.statusImageBadge, { backgroundColor: statusUI.color }]}>
                <MaterialCommunityIcons name={statusUI.icon as any} size={12} color="#FFF" />
                <Text style={styles.statusImageText}>{statusUI.label}</Text>
              </View>
            </View>

            <View style={styles.priceTagImage}>
              <Text style={styles.priceTagText}>{item.total_price?.toLocaleString()} $</Text>
            </View>
          </View>

          {/* CONTENT SECTION */}
          <View style={styles.cardContent}>
            <View style={styles.mainInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {property?.title || 'Chargement de la propriété...'}
              </Text>
              <View style={styles.locRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94A3B8" />
                <Text style={styles.locText} numberOfLines={1}>{property?.location || 'Localisation non définie'}</Text>
              </View>
            </View>

            {/* OWNER STRIP */}
            {owner && (
              <View style={styles.ownerStrip}>
                <Image
                  source={{ uri: owner.avatar_url || `https://ui-avatars.com/api/?name=${owner.name}&background=random` }}
                  style={styles.ownerAvatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ownerName}>{owner.name}</Text>
                  <Text style={styles.ownerRole}>Propriétaire / Agent</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCall(owner.phone)}
                  style={styles.callIconBtn}
                >
                  <MaterialCommunityIcons name="phone" size={18} color="#06B6D4" />
                </TouchableOpacity>
              </View>
            )}

            {/* METRICS */}
            <View style={styles.divider} />

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>ENTRÉE / DATE</Text>
                <View style={styles.metricValueRow}>
                  <MaterialCommunityIcons name="calendar-import" size={14} color="#64748B" />
                  <Text style={styles.metricValue}>{item.check_in || 'N/A'}</Text>
                </View>
              </View>

              <View style={[styles.metricItem, { alignItems: 'flex-end' }]}>
                <Text style={styles.metricLabel}>VOYAGEURS</Text>
                <View style={styles.metricValueRow}>
                  <MaterialCommunityIcons name="account-group-outline" size={14} color="#64748B" />
                  <Text style={styles.metricValue}>{item.guests || 0} Pers.</Text>
                </View>
              </View>
            </View>

            {/* NOTES PREVIEW */}
            {item.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesText} numberOfLines={2}>
                  <Text style={{ fontWeight: 'bold' }}>Note: </Text>
                  {item.notes}
                </Text>
              </View>
            )}
          </View>

          {/* ACTION FOOTER */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.chatAction}
              onPress={() => router.push(`/messaging/${owner?.id}`)}
            >
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#06B6D4" />
              <Text style={styles.chatActionText}>Chatter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.detailsAction, { backgroundColor: typeUI.color }]}>
              <Text style={styles.detailsActionText}>Détails de la demande</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={styles.loadingText}>Synchronisation Uzisha</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {renderHeader()}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true } // Change de false à true
        )}
        scrollEventThrottle={16} // Ajoute ceci pour une fluidité à 60fps
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06B6D4" />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {filteredBookings.length > 0 ? (
            filteredBookings.map((item, index) => (
              <View key={item.id || index.toString()}>
                {renderBookingCard(item, index)}
              </View>
            ))
          ) : (
            renderEmptyState()
          )}
        </Animated.View>
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

// --- STYLES ---
const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#020617' : '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: isDark ? '#020617' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: isDark ? '#020617' : '#F8FAFC',
    zIndex: 10,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: isDark ? '#F8FAFC' : '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#06B6D4',
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: isDark ? '#1E293B' : '#FFF',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
    gap: 8,
  },
  filterTabActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cardWrapper: {
    marginBottom: 25,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  card: {
    backgroundColor: isDark ? '#0F172A' : '#FFF',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? '#1E293B' : '#F1F5F9',
  },
  imageSection: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  cardBadgesRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadgeBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  statusImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusImageText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  priceTagImage: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceTagText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  cardContent: {
    padding: 20,
  },
  mainInfo: {
    marginBottom: 16,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: isDark ? '#F1F5F9' : '#0F172A',
    marginBottom: 6,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  ownerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
    padding: 12,
    borderRadius: 20,
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? '#F8FAFC' : '#0F172A',
  },
  ownerRole: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    marginVertical: 15,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 1.2,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: isDark ? '#CBD5E1' : '#334155',
  },
  notesBox: {
    marginTop: 15,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
    padding: 10,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#06B6D4',
  },
  notesText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
  },
  chatAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
  },
  chatActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#06B6D4',
  },
  detailsAction: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  detailsActionText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: isDark ? '#FFF' : '#0F172A',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreBtn: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  exploreBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 16,
  }
});