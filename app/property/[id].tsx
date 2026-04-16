import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Animated,
  Share,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
// --- Animation checkmark SVG ---
import Svg, { Circle, Path } from 'react-native-svg';

// --- Services & Utils ---
import { supabase } from '@/utils/supabase';

import { useColorScheme } from '@/components/useColorScheme';
import { PaymentModal } from '@/components/PaymentModal';
import Colors from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 350;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Helper pour traduire les types de biens en français
function getFrenchPropertyType(type: string) {
  const map: Record<string, string> = {
    house: 'Maison',
    apartment: 'Appartement',
    villa: 'Villa',
    duplex: 'Duplex',
    studio: 'Studio',
    building: 'Immeuble',
    room: 'Chambre',
    land: 'Terrain',
    restaurant: 'Restaurant',
    'event-space': 'Espace événementiel',
    gym: 'Salle de sport',
    boutique: 'Boutique',
    office: 'Bureau',
    coworking: 'Espace coworking',
    shop: 'Magasin',
    warehouse: 'Entrepôt',
    parking: 'Parking',
    phone: 'Téléphone',

    // Ajoute d'autres types si besoin
  };
  return map[type?.toLowerCase()] || type;
}

// --- Types ---
type PropertyData = {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  images: string[];
  videos?: string[];
  description: string;
  beds?: number;
  baths?: number;
  area?: number;
  parking_spaces?: number;
  features?: string[];
  user_id: string;
  is_verified?: boolean;
  coordinates?: { latitude: number; longitude: number };
  details?: any; // Pour les détails spécifiques à chaque type de bien
};

type UserData = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isCertificated?: boolean;
  role?: string;
  rating?: number;
  total_listings?: number;
};

type Review = {
  property_id: string;
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
};







// --- Sous-Composants ---

const SpecItem = ({ icon, label, value, isDark, styles }: any) => (
  <View style={[styles.specItem, isDark && styles.specItemDark]}>
    <View style={styles.specIconCircle}>
      <MaterialCommunityIcons name={icon} size={22} color="#06B6D4" />
    </View>
    <View>
      <Text style={[styles.specValue, isDark && styles.textWhite]}>{value || 'N/A'}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  </View>
);
const FeatureTag = ({ name, isDark, styles }: { name: string, isDark: boolean, styles: any }) => (
  <View style={[styles.featureTag, isDark && styles.featureTagDark]}>
    <MaterialCommunityIcons name="check-decagram" size={16} color="#06B6D4" />
    <Text style={[styles.featureTagText, isDark && styles.textWhite]}>{name}</Text>
  </View>
);

const AmenityItem = ({ icon, label, isDark, styles }: any) => (
  <View style={[styles.amenityRow, isDark && styles.amenityRowDark]}>
    <MaterialCommunityIcons name={icon} size={20} color="#06B6D4" />
    <Text style={[styles.amenityText, isDark && styles.textWhite]}>{label}</Text>
  </View>
);
const SectionHeader = ({ title, isDark, styles }: { title: string, isDark: boolean, styles: any }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={[styles.sectionLabel, isDark && styles.textWhite]}>{title}</Text>
    <View style={styles.sectionLine} />
  </View>
);
const EnergyBadge = ({ letter, color, active, styles }: any) => (
  <View style={[
    styles.energyBox,
    { backgroundColor: active ? color : 'transparent', borderColor: color },
    !active && { borderWidth: 1 }
  ]}>
    <Text style={[styles.energyLetter, active ? { color: '#FFF' } : { color: color }]}>{letter}</Text>
  </View>
);
const DocumentItem = ({ title, size, styles, isDark }: any) => (
  <TouchableOpacity style={[styles.docItem, isDark && styles.docItemDark]}>
    <View style={styles.docIconBox}>
      <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={[styles.docTitle, isDark && styles.textWhite]}>{title}</Text>
      <Text style={styles.docSize}>{size}</Text>
    </View>
    <MaterialCommunityIcons name="download" size={20} color="#64748B" />
  </TouchableOpacity>
);
const NeighborhoodPoint = ({ type, name, distance, styles, isDark }: any) => (
  <View style={[styles.poiCard, isDark && styles.poiCardDark]}>
    <View style={styles.poiIconBox}>
      <MaterialCommunityIcons
        name={type === 'school' ? 'school' : type === 'hospital' ? 'hospital-marker' : 'shopping'}
        size={20}
        color={isDark ? "#94A3B8" : "#64748B"}
      />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={[styles.poiName, isDark && styles.textWhite]}>{name}</Text>
      <Text style={styles.poiDistance}>{distance} min à pied</Text>
    </View>
  </View>
);
// --- Écran Principal ---

export default function PropertyDetailScreen() {
    // Sécuriser reviews pour éviter les erreurs si undefined/null
   
  // --- States pour feedback réservation ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { id } = useLocalSearchParams();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;
  // Galerie/Review states
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageModalIndex, setImageModalIndex] = useState(0);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoModalIndex, setVideoModalIndex] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  // Charger les avis depuis la base de données

  const currentStyles = useMemo(() => getStyles(isDark, theme), [isDark, theme]);
  const [similarProperties, setSimilarProperties] = useState<PropertyData[]>([]);

  // Data States
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [propertyuser, setPropertyUser] = useState<UserData | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // UI States
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [isLightboxVisible, setIsLightboxVisible] = useState(false);
  const [reservationModal, setReservationModal] = useState(false);
  const [calculatorModal, setCalculatorModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState<string | undefined>(undefined);
  const [isPayModalVisible, setIsPayModalVisible] = useState(false);
  // Calculatrice States
  const [downPayment, setDownPayment] = useState('20000');
  const [loanTerm, setLoanTerm] = useState('20');
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const {user} = useAuth();
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const isMounted = useRef(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const videoWebViewRef = useRef<WebView>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const safeReviews = Array.isArray(reviews) ? reviews : [];

  // Fonction pour récupérer l'utilisateur courant
  const fetchCurrentUser = async (uid: string | null) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid);
    if (!error && data && data.length > 0) {
      setCurrentUser(data[0]);
      setUserCreatedAt(data[0].created_at);
    } else {
      setMessage("Utilisateur non trouvé.");
    }
  };
 const reviewCount = safeReviews.length;
    const averageRating =
      reviewCount > 0
        ? (
            safeReviews.reduce((sum, r) => sum + (typeof r.rating === 'number' ? r.rating : 0), 0) / reviewCount
          ).toFixed(1)
        : '—';
  useEffect(() => {
    isMounted.current = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          setUserId(user?.id || null);
          if (user?.id) fetchCurrentUser(user.id);
        });
      } else {
        setMessage(" Veuillez vous connecter pour réserver.");
      }
    });
    return () => { isMounted.current = false; };
  }, []);
  useEffect(() => {
    if (!property?.id) return;
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('property_id', property.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setReviews(data);
      }
    };
    fetchReviews();
  }, [property?.id]);
  const AnimatedCheckmark = () => {
    const scale = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 80,
      }).start();
    }, []);
    return (
      <Animated.View style={{ transform: [{ scale }], opacity: scale }}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={30} fill="#06B6D4" />
          <Path
            d="M20 34 L30 44 L46 26"
            stroke="#FFF"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    );
  };

  useEffect(() => {
    if (!property) return;
    const fetchSimilar = async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .neq('id', property.id)
        .eq('type', property.type)
        .limit(8);
      if (!error && data) setSimilarProperties(data);
    };
    fetchSimilar();
  }, [property]);
  // Simulation de plusieurs vidéos si property.videos n'en a qu'une
  const videoList = useMemo(() => {
    if (!property?.videos || property.videos.length === 0) return [];
    // Pour la démo, on duplique si besoin, sinon on prend property.videos
    return property.videos.length > 1 ? property.videos : [property.videos[0], property.videos[0]];
  }, [property]);
  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- Fonction pour l'achat direct (Netflix, etc.) ---
  // --- Fonction d'achat via Flutterwave (M-Pesa/Airtel/Orange) ---
  const handlePurchase = () => {
    if (!userId) {
      Alert.alert("Connexion requise", "Vous devez être connecté pour acheter.");
      router.push('/login');
      return;
    }
    if (!propertyuser?.isCertificated) {
      Alert.alert("Certification", "Compte non certifié.");
      return;
    }
    setIsPayModalVisible(true); // Ouvre simplement le modal Flutterwave
  };
  useEffect(() => {
    fetchData();
  }, [id]);

  const onPaymentComplete = async (ref: string) => {
    // Cette fonction est appelée quand le Modal de paiement a fini son travail

    const { error } = await supabase.from('sales').insert({
      property_id: property?.id,
      buyer_id: userId,
      amount: property?.price,
      transaction_ref: ref,
      status: 'completed'
    });

    if (!error) {
      setShowSuccessModal(true); // Ton animation verte
    }
  };
  // Récupère les dates indisponibles pour l'admin du bien
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      if (!property?.user_id) return;
      const { data, error } = await supabase
        .from('admin_availability')
        .select('date')
        .eq('admin_id', property.user_id)
        .eq('is_available', false);
      if (!error && data) {
        // Ne garder que les dates d'indisponibilité à venir
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setUnavailableDates(
          data
            .map((d: any) => d.date)
            .filter((date: string) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d >= today;
            })
        );
      }
    };
    if (property && isImmobilier(property.type)) {
      fetchUnavailableDates();
    }
  }, [property]);

  // Helper pour type immobilier
  function isImmobilier(type?: string) {
    if (!type) return false;
    return ['house', 'apartment', 'villa', 'duplex', 'studio', 'building', 'room', 'land', 'restaurant', 'event-space', 'gym'].includes(type.toLowerCase());
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: prop, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propError) throw propError;

      if (prop) {
        setProperty(prop);
        const { data: userData } = await supabase
          .from('users')
          .select('*, created_at')
          .eq('id', prop.user_id)
          .single();
        setPropertyUser(userData);
        setUserCreatedAt(userData?.created_at || null);

        // Check if favorite
        const { data: fav } = await supabase
          .from('favorites')
          .select('*')
          .eq('property_id', id)
          .single();
        setIsFavorite(!!fav);
      }
      // --- Helper pour l'ancienneté du compte utilisateur ---
      // (Déplacé hors de fetchData)
      // --- Helper pour l'ancienneté du compte utilisateur ---

    } catch (err) {
      console.error('Fetch Error:', err);
      Alert.alert('Erreur', 'Impossible de charger les détails du bien.');
    } finally {
      setLoading(false);
    }
  };
  const getAccountAge = (createdAt: string | null) => {
    if (!createdAt) return '';
    const created = new Date(createdAt);
    const now = new Date();
    let years = now.getFullYear() - created.getFullYear();
    let months = now.getMonth() - created.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) {
      return years + (years === 1 ? ' an' : ' ans');
    } else if (months > 0) {
      return months + (months === 1 ? ' mois' : ' mois');
    } else {
      return 'Nouveau';
    }
  }
  // --- Logique métier ---

  const toggleFavorite = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFavorite(!isFavorite);
    // Simulation d'appel API
    try {
      if (!isFavorite) {
        await supabase.from('favorites').insert({ property_id: id });
      } else {
        await supabase.from('favorites').delete().eq('property_id', id);
      }
    } catch (e) {
      console.log('Fav toggle failed silently for demo');
    }
  };

  const calculateMortgage = () => {
    if (!property) return;
    const principal = property.price - parseFloat(downPayment || '0');
    const monthlyRate = 0.045 / 12; // 4.5% taux fixe simulation
    const numberOfPayments = parseInt(loanTerm) * 12;

    const monthly =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setMonthlyPayment(Math.round(monthly));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Visitez cet article sur uzisha app : ${property?.title} à ${property?.location}. Prix:${property?.price}$ \nLien: \nhttps://uzisha.netlify.app/property/${id}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // --- Animations du Header ---
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  if (loading || !property) {
    return (
      <View style={currentStyles.loaderContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={{ marginTop: 10, color: isDark ? '#FFF' : '#64748B' }}>Chargement en cours ...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={currentStyles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />


      {/* HEADER PROFESSIONNEL ET INFORMATIF */}
      <View style={{ backgroundColor: 'transparent', paddingTop: Platform.OS === 'android' ? 36 : 18, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, backgroundColor: isDark ? '#334155' : '#F1F5F9', borderRadius: 20 }}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={isDark ? '#FFF' : '#222'} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleShare} style={{ marginRight: 10, padding: 8, backgroundColor: isDark ? '#334155' : '#F1F5F9', borderRadius: 20 }}>
              <MaterialCommunityIcons name="share-variant" size={24} color={isDark ? '#FFF' : '#222'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={{ padding: 8, backgroundColor: isDark ? '#334155' : '#F1F5F9', borderRadius: 20 }}>
              <MaterialCommunityIcons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#EF4444" : isDark ? '#FFF' : '#222'} />
            </TouchableOpacity>
          </View>
        </View>




      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* IMAGE PRINCIPALE + INFOS */}
        <Animated.View style={[currentStyles.mainBannerContainer, { opacity: imageOpacity }]}>
          <Image
            source={{ uri: property.images[selectedImgIndex] }}
            style={currentStyles.mainBannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
            style={currentStyles.bannerGradient}
          />
          {/* MEDIA SELECTOR (Miniatures) */}
          <View style={currentStyles.mediaSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={currentStyles.mediaScroll}>
              {property.images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => { setSelectedImgIndex(index); }}
                  style={[currentStyles.thumbnailWrap, selectedImgIndex === index && currentStyles.activeThumbnail]}
                >
                  <Image source={{ uri: img }} style={currentStyles.thumbnail} />
                  {selectedImgIndex === index && (
                    <View style={currentStyles.activeThumbnailOverlay}>
                      <MaterialCommunityIcons name="eye" size={20} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>



        {/* GALERIE UNIQUE : Images, Vidéos, Reviews */}
        <View style={currentStyles.contentCard}>
          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <View style={{ backgroundColor: '#E0F7FA', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
                <Text style={{ color: '#06B6D4', fontWeight: 'bold', fontSize: 13 }}>{getFrenchPropertyType(property.type)}</Text>
              </View>
              {property.is_verified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#06B6D4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13, marginLeft: 4 }}>Vérifié</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
              <Text style={{ color: isDark ? '#FFF' : '#222', marginLeft: 4, fontWeight: '600' }}>{averageRating}</Text>
              <Text style={{ color: isDark ? '#CBD5E1' : '#64748B', marginLeft: 4, fontSize: 12 }}>
                ({reviewCount} avis)
              </Text>
            </View>

          </View>
          {/* TITRE & BADGES */}
          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDark ? '#FFF' : '#222', fontSize: 24, fontWeight: 'bold', marginBottom: 2 }}>{property.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#06B6D4" />
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 15, marginLeft: 4 }}>{property.location}</Text>
              </View>

            </View>
            <TouchableOpacity style={{ backgroundColor: '#06B6D4', borderRadius: 50, padding: 0 }}>
              <MaterialCommunityIcons name="send-circle" size={48} color="white" />
            </TouchableOpacity>
          </View>


          <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 32, alignItems: 'center', width: 320 }}>
                <AnimatedCheckmark />
                <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#06B6D4', marginBottom: 8 }}>Réservation réussie !</Text>
                <Text style={{ color: '#64748B', fontSize: 16, textAlign: 'center', marginBottom: 18 }}>Votre réservation a été enregistrée. Le vendeur vous contactera bientôt.</Text>
                <TouchableOpacity onPress={() => setShowSuccessModal(false)} style={{ backgroundColor: '#06B6D4', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* Pour les autres types, bouton Acheter si vendeur certifié */}
          {/* {!isImmobilier(property.type) && user?.isCertificated && (
            <TouchableOpacity
              style={{ backgroundColor: '#06B6D4', borderRadius: 10, paddingVertical: 14, marginTop: 10, alignItems: 'center' }}
              onPress={() => Alert.alert('Achat', 'Procédure d’achat à implémenter')}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Acheter</Text>
            </TouchableOpacity>
          )} */}

          {/* DESCRIPTION */}
          <View style={{ marginTop: 18 }}>
            <Text style={{ color: isDark ? '#FFF' : '#222', fontWeight: 'bold', fontSize: 16, marginBottom: 2 }}>Description</Text>
            <Text style={{ color: isDark ? '#CBD5E1' : '#64748B', fontSize: 15, lineHeight: 22, marginTop: 4 }}>{property.description}</Text>
          </View>
          {/* IMAGES */}
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, marginTop: 10, color: isDark ? '#FFF' : '#222' }}>Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {property.images.map((img, idx) => (
              <TouchableOpacity key={idx} onPress={() => { setImageModalIndex(idx); setImageModalVisible(true); }}>
                <Image source={{ uri: img }} style={{ width: 160, height: 110, borderRadius: 12, marginHorizontal: 8 }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* MODAL IMAGE LIGHTBOX CUSTOM */}
          <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
              <Image source={{ uri: property.images[imageModalIndex] }} style={{ width: width * 0.9, height: height * 0.6, borderRadius: 16, resizeMode: 'contain' }} />
              <View style={{ flexDirection: 'row', marginTop: 18 }}>
                <TouchableOpacity disabled={imageModalIndex === 0} onPress={() => setImageModalIndex(i => Math.max(0, i - 1))} style={{ marginHorizontal: 20 }}>
                  <MaterialCommunityIcons name="chevron-left" size={36} color={imageModalIndex === 0 ? '#888' : '#FFF'} />
                </TouchableOpacity>
                <TouchableOpacity disabled={imageModalIndex === property.images.length - 1} onPress={() => setImageModalIndex(i => Math.min(property.images.length - 1, i + 1))} style={{ marginHorizontal: 20 }}>
                  <MaterialCommunityIcons name="chevron-right" size={36} color={imageModalIndex === property.images.length - 1 ? '#888' : '#FFF'} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setImageModalVisible(false)} style={{ position: 'absolute', top: 40, right: 30 }}>
                <MaterialCommunityIcons name="close" size={36} color="#FFF" />
              </TouchableOpacity>
            </View>
          </Modal>

          {/* VIDEOS */}
          {property.videos && property.videos.length > 0 && (
            <>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, marginLeft: 7, color: isDark ? '#FFF' : '#222' }}>Vidéos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                {property.videos.map((vid, idx) => (
                  <TouchableOpacity key={idx} onPress={() => { setVideoModalIndex(idx); setVideoModalVisible(true); }}>
                    <View style={{ width: 160, height: 110, borderRadius: 12, marginHorizontal: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="play-circle" size={48} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* MODAL VIDEO */}
              <Modal visible={videoModalVisible} animationType="slide" onRequestClose={() => setVideoModalVisible(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                  <TouchableOpacity style={{ position: 'absolute', top: 30, right: 20, zIndex: 10 }} onPress={() => setVideoModalVisible(false)}>
                    <MaterialCommunityIcons name="close" size={32} color="#FFF" />
                  </TouchableOpacity>
                  <WebView
                    source={{ uri: property.videos[videoModalIndex] }}
                    style={{ flex: 1, marginTop: 60 }}
                    allowsFullscreenVideo
                  />
                  {/* Playlist vidéos */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#111', paddingVertical: 10 }}>
                    {property.videos.map((vid, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setVideoModalIndex(idx)}>
                        <View style={{ width: 100, height: 60, borderRadius: 8, marginHorizontal: 6, backgroundColor: idx === videoModalIndex ? '#06B6D4' : '#222', justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialCommunityIcons name="play-circle" size={28} color="#FFF" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </SafeAreaView>
              </Modal>
            </>
          )}


        </View>



        {/* MODAL PLEIN ÉCRAN DÉDIÉ */}
        <Modal visible={isVideoFullscreen} animationType="fade" transparent={false}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <TouchableOpacity
              style={currentStyles.closeFullscreen}
              onPress={() => setIsVideoFullscreen(false)}
            >
              <MaterialCommunityIcons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            <WebView
              source={{ uri: videoList[selectedVideoIndex] }}
              style={{ flex: 1 }}
              allowsFullscreenVideo
            />
          </SafeAreaView>
        </Modal>
        {/* Ajouter du text demander a l'utilisateur s'il souhaite discuter avec le vendeur du produit de clicker sur le chat  */}
        <Text style={{ color: isDark ? 'white' : Colors.black, fontSize: 14, marginBottom: 10, marginLeft: 25 }}>Vous avez des questions sur ce bien ? N'hésitez pas à discuter directement avec le vendeur certifié.</Text>


        {/* VENDOR PROFILE */}
        {propertyuser && (
          <View style={[currentStyles.vendorCard, isDark && currentStyles.vendorCardDark]}>
            <View style={currentStyles.vendorHeader}>
              <Image source={{ uri: propertyuser.avatar || 'https://via.placeholder.com/150' }} style={currentStyles.vendorAvatar} />
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={[currentStyles.vendorName, isDark && currentStyles.textWhite]}>{propertyuser.name}</Text>
                <View style={currentStyles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                  <Text style={currentStyles.ratingText}>4.8 (24 avis)</Text>
                </View>
                <Text style={currentStyles.vendorRole}>{propertyuser.isCertificated ? 'Agent Certifié' : 'Particulier Non Certifié'}</Text>
              </View>
              <TouchableOpacity
                style={currentStyles.vendorMsgBtn}
                onPress={() => router.push({ pathname: '/messaging/[agentId]', params: { agentId: propertyuser.id } })}
              >
                <MaterialCommunityIcons name="message-text" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={currentStyles.vendorStats}>
              <View style={currentStyles.statItem}>
                <Text style={currentStyles.statValue}>(indisponible)</Text>
                <Text style={currentStyles.statLabel}>Ventes</Text>
              </View>
              <View style={currentStyles.statDivider} />
              <View style={currentStyles.statItem}>
                <Text style={currentStyles.statValue}>{getAccountAge(userCreatedAt)}</Text>
                <Text style={currentStyles.statLabel}>Expérience</Text>
              </View>
            </View>
          </View>
        )}

        {/* REVIEWS SECTION */}
        <View style={currentStyles.reviewSection}>
          <SectionHeader styles={currentStyles} title="Avis clients" isDark={isDark} />
          {reviews.slice(0, 5).map(review => {
            // Formatage de la date en JJ/MM/AAAA
            let formattedDate = '';
            try {
              const d = new Date(review.created_at);
              formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            } catch {
              formattedDate = review.created_at;
            }
            return (
              <View key={review.id} style={[currentStyles.reviewCard, { backgroundColor: isDark ? Colors.dark.surface : Colors.gray100 }]}> 
                <View style={currentStyles.rowBetween}>
                  <Text style={[currentStyles.reviewUser, isDark && currentStyles.textWhite]}>{review.user_name}</Text>
                  <Text style={currentStyles.reviewDate}>{formattedDate}</Text>
                </View>
                <View style={currentStyles.starRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <MaterialCommunityIcons key={s} name="star" size={14} color={s <= review.rating ? "#F59E0B" : "#CBD5E1"} />
                  ))}
                </View>
                <Text style={[currentStyles.reviewComment, isDark && currentStyles.textMuted]}>{review.comment}</Text>
              </View>
            );
          })}
          {/* AJOUTER UN AVIS */}
          <View style={{ backgroundColor: isDark ? Colors.dark.surface : Colors.gray100, borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: isDark ? 'white' : 'black' }}>Ajouter un avis</Text>
            <View style={{ flexDirection: 'row', marginBottom: 15 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <TouchableOpacity key={i} onPress={() => setUserRating(i)}>
                  <MaterialCommunityIcons
                    name={i <= userRating ? 'star' : 'star-outline'}
                    size={28}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Votre commentaire..."
              placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.gray500}
              value={userReview}
              onChangeText={setUserReview}
              style={{
                backgroundColor: isDark ? Colors.dark.background : Colors.white,
                color: isDark ? 'white' : Colors.light.text,
                borderRadius: 8,
                paddingVertical: 16,
                paddingHorizontal: 12,
                fontSize: 15,
                borderWidth: 1,
                borderColor: isDark ? Colors.dark.border : Colors.gray300,
                marginTop: 4,
                marginBottom: 4,
                minHeight: 60,
              }}
              multiline
            />
            <TouchableOpacity
              style={{ backgroundColor: Colors.eventSpaceColor, borderRadius: 8, paddingVertical: 10, marginTop: 10, alignItems: 'center' }}
              onPress={async () => {
                if (userRating > 0 && userReview.trim()) {
                  let userName = currentUser?.name;
                  // Si currentUser est null, on tente de le récupérer à nouveau
                  if (!userName && userId) {
                    await fetchCurrentUser(userId);
                    userName = currentUser?.name;
                  }
                  if (!userName) userName = 'Utilisateur';
                  // Ajout dans la base
                  console.log('Adding review...:', { property_id: property.id, user_id: userId, user_name: userName, rating: userRating, comment: userReview });
                  const { data, error } = await supabase
                    .from('reviews')
                    .insert({
                      property_id: property.id,
                      user_id: userId,
                      user_name: userName,
                      rating: userRating,
                      comment: userReview,
                      created_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
                  if (!error && data) {
                    setReviews([data, ...reviews]);
                    setUserRating(0);
                    setUserReview('');
                    Alert.alert('Merci !', 'Votre avis a été soumis.');
                  } else if (error && error.code === '23505') {
                    // 23505 = unique_violation in Postgres
                    Alert.alert('Déjà soumis', 'Vous avez déjà laissé un avis pour ce bien.');
                  } else {
                    Alert.alert('Erreur', "Impossible d'enregistrer l'avis.");
                  }
                }
              }}
            >
              <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 15 }}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SIMILAR PROPERTIES */}
        <View style={currentStyles.similarSection}>
          <SectionHeader styles={currentStyles} title="Biens similaires" isDark={isDark} />
          <FlatList
            horizontal
            data={similarProperties}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[currentStyles.similarCard, isDark && currentStyles.similarCardDark]}
                onPress={() => router.push({ pathname: '/property/[id]', params: { id: item.id } })}
              >
                <Image source={{ uri: item.images?.[0] || '' }} style={currentStyles.similarImg} />
                <View style={currentStyles.similarContent}>
                  <Text style={[currentStyles.similarTitle, isDark && currentStyles.textWhite]} numberOfLines={1}>{item.title}</Text>
                  {/* ameliorer le design en ajoutant le bouton visiter  et le prix */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: isDark ? 'white' : Colors.eventSpaceColor , fontWeight: 'bold' }}>$ {item.price.toLocaleString()}</Text>
                    <TouchableOpacity style={{ backgroundColor: Colors.eventSpaceColor, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 }}>
                      <Text style={{ color: '#FFF', fontSize: 12 }}>Visiter  
                        {/* ajouter licon de flechet droite */}
                        <MaterialCommunityIcons name="arrow-right" size={14} color="#FFF" style={{ marginLeft: 4 }} />
                             </Text>
                    </TouchableOpacity>
                  </View>

                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Animated.ScrollView>

      {/* FOOTER MODERNE */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? Colors.dark.background : Colors.white, padding: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 }}>

        <View style={{ flex: 1 }}>
          <Text style={{ color: isDark ? Colors.dark.textSecondary : Colors.gray500, fontSize: 13 }}>Prix Total</Text>
          <Text style={{ color: Colors.eventSpaceColor, fontWeight: 'bold', fontSize: 18 }}>$ {property.price.toLocaleString()}</Text>
        </View>
        <View style={{ padding: 0, backgroundColor: isDark ? Colors.dark.background : Colors.white }}>
          {/* Ajouter un warning demandans l'utilisateur de s'authentifier avant de réserver */}
          {message ? (
            <Text style={{ color: Colors.error, fontSize: 12, marginBottom: 8 }}>
              {message}
            </Text>
          ) : null}
          {isImmobilier(property.type) ? (
            /* SCÉNARIO 1 : C'EST DE L'IMMOBILIER -> BOUTON RÉSERVER */
            <TouchableOpacity
              style={{ backgroundColor: Colors.eventSpaceColor, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
              onPress={() => {
                if (!userId) {
                  // Redirige ou affiche une alerte
                  Alert.alert("Connexion requise", "Vous devez être connecté pour réserver.");
                  // router.push('/auth/login'); // décommente si tu veux une redirection
                  return;
                }
                setReservationModal(true);
              }}
            >
              <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 16, paddingHorizontal: 16 }}>Réserver la visite</Text>
            </TouchableOpacity>
          ) : (
            /* SCÉNARIO 2 : AUTRES TYPES (EX: NETFLIX, ETC.) */
            propertyuser?.isCertificated ? (
              /* L'UTILISATEUR QUI POSSÈDE LE PRODUIT (OU LE CLIENT ACTUEL) EST CERTIFIÉ */
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.eventSpaceColor,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: reservationLoading ? 0.7 : 1 // Grisé si en chargement
                }}
                disabled={reservationLoading}
                onPress={() => handlePurchase()}
              >
                {reservationLoading ? (
                  <ActivityIndicator color={Colors.white} style={{ marginRight: 10 }} />
                ) : (
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 16, marginHorizontal: 16 }}>
                  {reservationLoading ? "Traitement..." : "Acheter maintenant"}
                </Text>
              </TouchableOpacity>
            ) : (
              /* NON CERTIFIÉ : BOUTON GRISÉ */
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>
                  Certification requise pour cet achat
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: isDark ? Colors.dark.border : Colors.gray400, borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center' }}
                  onPress={() => alert("Votre compte doit être certifié pour acheter ce type de produit.")}
                >
                  <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 16 }}>Achat restreint</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </View>

      {/* --- MODALS --- */}

      {/* 1. RESERVATION MODAL */}
      <Modal visible={reservationModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 25,
              minHeight: height * 0.7
            }}
          >
            <View style={{ width: 40, height: 5, backgroundColor: theme.border, borderRadius: 10, alignSelf: 'center', marginBottom: 15 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.primary }}>Planifier une visite</Text>
              <TouchableOpacity onPress={() => setReservationModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={30} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SÉLECTION DE LA DATE */}
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: 10 }}>Date souhaitée</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return Array.from({ length: 30 }).map((_, i) => {
                    const d = new Date(today);
                    d.setDate(today.getDate() + i);
                    const iso = d.toISOString().slice(0, 10);
                    const isUnavailable = unavailableDates.includes(iso);
                    if (isUnavailable) return null;
                    return (
                      <TouchableOpacity
                        key={iso}
                        style={[
                          {
                            paddingHorizontal: 22,
                            paddingVertical: 18,
                            backgroundColor: theme.surface,
                            borderRadius: 16,
                            marginRight: 12,
                            alignItems: 'center',
                            borderWidth: 1,
                            maxHeight: 60,
                            borderColor: theme.border
                          },
                          selectedDate === iso && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                        ]}
                        onPress={() => setSelectedDate(iso)}
                      >
                        <Text style={[
                          { fontWeight: 'bold', color: Colors.primary },
                          selectedDate === iso && { color: Colors.white }
                        ]}>
                          {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>

              {/* SÉLECTION DE L'HEURE */}
              {selectedDate && (
                <View style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: 10 }}>Créneaux horaires</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {['09:00', '11:00', '14:00', '16:00'].map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          {
                            width: '30%',
                            padding: 14,
                            borderRadius: 12,
                            backgroundColor: theme.surfaceVariant,
                            alignItems: 'center'
                          },
                          selectedTime === t && { backgroundColor: Colors.primary }
                        ]}
                        onPress={() => setSelectedTime(t)}
                      >
                        <Text style={[
                          { fontWeight: '600', color: theme.text },
                          selectedTime === t && { color: Colors.white }
                        ]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* CHAMP NOTE / MESSAGE */}
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginTop: 20, marginBottom: 10 }}>Note ou message particulier</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 8,
                  marginBottom: 15,
                  fontSize: 15,
                  height: 90,
                  textAlignVertical: 'top',
                  backgroundColor: theme.surface,
                  color: theme.text
                }}
                placeholder="Ex: Je viendrai avec mon architecte..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={{ flexDirection: 'row', backgroundColor: theme.surfaceVariant, padding: 15, borderRadius: 12, marginTop: 25, alignItems: 'center' }}>
                <MaterialCommunityIcons name="information-outline" size={20} color={theme.textSecondary} />
                <Text style={{ flex: 1, fontSize: 12, color: theme.textSecondary, marginLeft: 10, lineHeight: 18 }}>
                  Des frais de visite s'appliquent pour confirmer la disponibilité de l'agent.
                </Text>
              </View>

              {/* BOUTON DE CONFIRMATION */}
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary,
                  borderRadius: 8,
                  paddingVertical: 15,
                  alignItems: 'center',
                  marginBottom: 30,
                  opacity: (reservationLoading || !selectedDate || !selectedTime) ? 0.6 : 1
                }}
                disabled={reservationLoading || !selectedDate || !selectedTime}
                onPress={async () => {
                  if (!selectedDate || !selectedTime) {
                    alert("Veuillez choisir une date et une heure.");
                    return;
                  }
                  setReservationLoading(true);

                  // 1. Calcul du Check-Out (+1 jour pour la contrainte SQL)
                  const dateArrivee = new Date(selectedDate);
                  const dateDepart = new Date(dateArrivee);
                  dateDepart.setDate(dateArrivee.getDate() + 1);
                  const isoCheckOut = dateDepart.toISOString().slice(0, 10);
                  if (!userId) {
                    alert("Vous devez être connecté pour confirmer la réservation.");
                    router.push('/login');
                    setReservationLoading(false);
                    return;
                  }
                  const reservationPayload = {
                    property_id: property.id,
                    user_id: userId,
                    check_in: selectedDate,
                    check_out: isoCheckOut,
                    guests: 1,
                    time_slot: selectedTime,
                    total_price: property.price,
                    status: 'pending',
                    notes: notes,
                    transactionType: 'reservation'
                  };

                  // 2. Insertion de la réservation
                  const { error, data } = await supabase
                    .from('reservations')
                    .insert(reservationPayload)
                    .select()
                    .single();

                  if (!error) {
                    // 3. Notification au PROPRIÉTAIRE
                    await supabase.from('notifications').insert({
                      user_id: property.user_id,
                      title: "Nouvelle demande de visite 🏠",
                      content: `Visite prévue pour "${property.title}" le ${selectedDate} à ${selectedTime}.`,
                      type: "reservation_new",
                      metadata: { reservation_id: data?.id }
                    });

                    // 4. Notification au CLIENT
                    await supabase.from('notifications').insert({
                      user_id: user?.id,
                      title: "Demande envoyée ✅",
                      content: `Votre demande pour ${property.title} est en attente de confirmation.`,
                      type: "reservation_sent"
                    });

                    setReservationModal(false);
                    setSelectedDate(null);
                    setSelectedTime(null);
                    setNotes('');
                    setShowSuccessModal(true);
                  } else {
                    console.error('[RESERVATION_ERROR]', error);
                    alert("Erreur : " + error.message);
                  }
                  setReservationLoading(false);
                }}
              >
                <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 16 }}>
                  {reservationLoading ? "Traitement..." : "Confirmer la réservation"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 2. MORTGAGE CALCULATOR MODAL */}
      <Modal visible={calculatorModal} animationType="fade" transparent={true}>
        <View style={currentStyles.modalOverlay}>
          <View style={[currentStyles.calcModal, isDark && currentStyles.calcModalDark]}>
            <Text style={[currentStyles.sheetTitle, isDark && currentStyles.textWhite]}>Calculatrice Immobilière</Text>

            <View style={currentStyles.calcInputGroup}>
              <Text style={currentStyles.inputLabel}>Apport personnel ($)</Text>
              <TextInput
                style={[currentStyles.calcInput, isDark && currentStyles.calcInputDark]}
                value={downPayment}
                onChangeText={setDownPayment}
                keyboardType="numeric"
                placeholder="Ex: 20000"
              />
            </View>

            <View style={currentStyles.calcInputGroup}>
              <Text style={currentStyles.inputLabel}>Durée (Années)</Text>
              <TextInput
                style={[currentStyles.calcInput, isDark && currentStyles.calcInputDark]}
                value={loanTerm}
                onChangeText={setLoanTerm}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={currentStyles.calcActionBtn} onPress={calculateMortgage}>
              <Text style={currentStyles.calcActionText}>Recalculer</Text>
            </TouchableOpacity>

            <View style={currentStyles.resultBox}>
              <Text style={currentStyles.resultLabel}>Mensualité estimée</Text>
              <Text style={currentStyles.resultValue}>{monthlyPayment.toLocaleString()}$ / mois</Text>
              <Text style={currentStyles.resultNote}>Basé sur un taux fixe de 4.5%</Text>
            </View>

            <TouchableOpacity style={currentStyles.closeBtn} onPress={() => setCalculatorModal(false)}>
              <Text style={currentStyles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* DANS TON COMPOSANT PRINCIPAL */}
      <PaymentModal
        visible={isPayModalVisible}
        onClose={() => setIsPayModalVisible(false)}
        amount={property?.price || 0}
        userEmail={user?.email || ""}
        userName={user?.name || "Client eMobilier"}
        phoneNumber={user?.phone || ""}
        onSuccess={async (transactionId) => {
          // 1. Enregistrement de la vente réussie dans Supabase
          const { error } = await supabase.from('sales').insert({
            property_id: property?.id,
            buyer_id: userId,
            amount: property?.price,
            transaction_ref: transactionId,
            status: 'completed'
          });

          if (!error) {
            // 2. Déclenchement de l'animation de succès
            setShowSuccessModal(true);
            // 3. Envoyer les accès si c'est un compte Netflix (via notification)
          }
        }}
      />
    </SafeAreaView>
  );
}

// --- Styles ---

const getStyles = (isDark: boolean, theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWhite: { color: Colors.white },
  textMuted: { color: theme.textSecondary },

  // Banner
  mainBannerContainer: {
    height: HEADER_MAX_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  mainBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  bannerTopActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '06B6D4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 8,
  },
  typeTag: {
    backgroundColor: '#06B6D4',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeTagText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  bannerPrice: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },

  // Media
  mediaSelector: {
    marginTop: -100,
    paddingLeft: 20,
  },
  mediaScroll: {

    backgroundColor: 'white',
    padding: 5,
    borderRadius: 12,
    elevation: 4,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  activeThumbnail: {
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  activeThumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  contentCard: {
    padding: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    color: '#64748B',
    fontSize: 15,
    marginLeft: 6,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: isDark ? '#06B6D4' : '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
    marginLeft: 20,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.eventSpaceColor,
    marginRight: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specItem: {
    width: '48%',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.gray200,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  specItemDark: {
    backgroundColor: Colors.eventSpaceColor,
    borderColor: Colors.dark.border,
  },
  specValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: Colors.eventSpaceColor,
  },
  specLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  featureContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 10,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  featureTagDark: {
    backgroundColor: Colors.eventSpaceColor,
  },
  featureTagText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Calculator Banner
  calculatorBanner: {
    marginTop: 30,
    backgroundColor: '#06B6D4',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  calcSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },

  // Video Visite
  videoSection: {
    padding: 20,
  },
  videoWrapper: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 10,
  },
  videoPlayer: {
    flex: 1,
  },

  // Vendor Card
  vendorCard: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.gray200,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  vendorCardDark: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.border,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.eventSpaceColor,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  vendorRole: {
    color: Colors.eventSpaceColor,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  vendorMsgBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.eventSpaceColor,
    justifyContent: 'center',
    alignItems: 'center',
  },

  vendorStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#334155' : '#F1F5F9',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: isDark ? '#334155' : '#F1F5F9',
  },

  // Reviews
  reviewSection: {
    padding: 20,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
  },
  reviewCardDark: {
    backgroundColor: '#06B6D4',
  },
  reviewUser: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  starRow: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  // Similar Properties
  similarSection: {
    marginBottom: 40,
  },
  similarCard: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  similarCardDark: {
    backgroundColor: '#06B6D4',
    borderColor: '#334155',
  },
  similarImg: {
    width: '100%',
    height: 100,
  },
  similarContent: {
    padding: 10,
  },
  similarTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  similarPrice: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: '700',
    marginTop: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  footerDark: {
    backgroundColor: '#0F172A',
    borderTopColor: '#06B6D4',
  },
  footerPriceGroup: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footerPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#06B6D4',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    justifyContent: 'flex-end',
  },
  footerCallBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primaryAction: {
    backgroundColor: '#06B6D4',
    height: 54,
    paddingHorizontal: 20,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  primaryActionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Modals Base
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  reservationSheet: {
    backgroundColor: isDark ? '#06B6D4' : '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 25,
    minHeight: height * 0.7,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },
  dateScroll: {
    marginBottom: 10,
  },
  dateCard: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    maxHeight: 60,
    borderColor: '#E2E8F0',
  },
  dateCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  activeDateCard: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
  },
  dateText: {
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    width: '30%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  timeSlotDark: {
    backgroundColor: '#0F172A',
  },
  activeTimeSlot: {
    backgroundColor: '#06B6D4',
  },
  timeText: {
    fontWeight: '600',
    color: '#475569',
  },
  whiteText: {
    color: '#FFF',
  },
  bookingInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    alignItems: 'center',
  },
  bookingInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    marginLeft: 10,
    lineHeight: 18,
  },
  confirmBookingBtn: {
    backgroundColor: '#06B6D4',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmBookingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Calc Modal
  calcModal: {
    backgroundColor: '#FFF',
    margin: 20,
    borderRadius: 24,
    padding: 25,
    width: width - 40,
  },
  calcModalDark: {
    backgroundColor: '#06B6D4',
  },
  calcInputGroup: {
    marginTop: 20,
  },
  calcInput: {
    backgroundColor: '#F1F5F9',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#06B6D4',
  },
  calcInputDark: {
    backgroundColor: '#0F172A',
    color: '#FFF',
  },
  calcActionBtn: {
    backgroundColor: '#06B6D4',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  calcActionText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#F0FDFA',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  resultLabel: {
    color: '#0F766E',
    fontSize: 14,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#06B6D4',
    marginVertical: 5,
  },
  resultNote: {
    fontSize: 11,
    color: '#5EAD97',
  },
  closeBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  specIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  neighborhoodContainer: {
    marginTop: 10,
  },
  poiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  poiCardDark: {
    backgroundColor: '#06B6D4',
    borderColor: '#334155',
  },
  poiIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: isDark ? '#334155' : '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poiName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#06B6D4',
  },
  poiDistance: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDFA',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  amenityRowDark: {
    backgroundColor: '#06B6D4',
  },
  amenityText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
    color: '#06B6D4',
  },

  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoCountBadge: {
    backgroundColor: '#06B6D420',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 15,
  },
  videoCountText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
  },
  videoMainContainer: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 220,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },

  fullscreenToggle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaylist: {
    marginTop: 15,
    paddingBottom: 10,
  },
  videoThumbnail: {
    width: 140,
    height: 90,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#06B6D4',
    position: 'relative',
  },
  activeVideoThumbnail: {
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  videoThumbImg: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  videoThumbTitle: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  closeFullscreen: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 99,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 15,
    fontSize: 15,
    height: 90,
    textAlignVertical: 'top', // Indispensable pour que le texte commence en haut sur Android
    backgroundColor: '#F8FAFC',
  },
});