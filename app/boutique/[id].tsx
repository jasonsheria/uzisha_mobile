import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  FC
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Modal,
  ScrollView,
  Platform,
  Pressable,
  SafeAreaView,
  Vibration,
  TextInput,
  Alert,
  LayoutAnimation,
  useColorScheme,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ImageStyle,
  KeyboardAvoidingView,
  Share as RNShare,
  BackHandler
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import ConciergeChat from '@/components/ConciergeChat';
// --- ICONS (LUCIDE) ---
import {
  ShoppingBag,
  ChevronLeft,
  Share2,
  ShieldCheck,
  MapPin,
  Heart,
  Trash2,
  X,
  Plus,
  Minus,
  Download,
  Search,
  ArrowRight,
  Filter,
  CreditCard,
  Clock,
  CheckCircle2,
  MessageCircle,
  Star,
  Zap,
  Tag,
  Award,
  Phone,
  Mail,
  Aperture,
  Globe,
  Send,
  Copy,
  Save,
  ExternalLink,
  Info,
  ShoppingCart,
  Camera,
  Verified,
  Layers,
  History,
  Gift,
  MoreHorizontal
} from 'lucide-react-native';
import { supabase } from '@/utils/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useNetwork } from '@/contexts/NetworkContext';

// ==========================================
// CONFIGURATION & CONSTANTES
// ==========================================

const { width, height } = Dimensions.get('window');
const IS_IOS = Platform.OS === 'ios';
const HEADER_MAX_HEIGHT = height * 0.45;
const HEADER_MIN_HEIGHT = IS_IOS ? 110 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const THEME = {
  gold: '#06B6D4',
  dark: '#0A0A0A',
  cardDark: '#121212',
  textGray: '#8E8E93',
  success: '#34C759',
  danger: '#FF3B30',
  white: '#FFFFFF'
};

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  boutique_id: string;
  description?: string;
  stock?: number;
  isNew?: boolean;
  rating?: number;
}

interface Boutique {
  id: string;
  user_id?: string; // Ajout du champ user_id pour la messagerie
  name: string;
  image: string;
  images?: string[];
  location: string;
  type: string[];
  rating: number;
  reviewCount: number;
  description: string;
  verified: boolean;
  phone?: string;
  email?: string;
  ville?: string,
  province?: string,
  instagram?: string;
  website?: string;
  openingHours?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// ==========================================
// COMPOSANTS ATOMIQUES (UI)
// ==========================================

const CustomBadge: FC<{ text: string; icon?: any; color?: string }> = ({ text, icon: Icon, color = THEME.gold }) => (
  <View style={[styles.badgeContainer, { borderColor: color }]}>
    {Icon && <Icon size={12} color={color} />}
    <Text style={[styles.badgeText, { color }]}>{text.toUpperCase()}</Text>
  </View>
);

const SkeletonBox: FC<{ width?: any; height?: any; borderRadius?: number; style?: any }> = ({ width, height, borderRadius = 10, style }) => {
  const isDark = useColorScheme() === 'dark';
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, opacity: animatedValue, backgroundColor: isDark ? '#222' : '#E1E1E1' },
        style
      ]}
    />
  );
};

// ==========================================
// COMPOSANT CARD PRODUIT
// ==========================================

const PremiumProductCard = React.memo(({
  item,
  liked,
  onPress,
  onLike,
  onAddToCart
}: {
  item: Product;
  liked: boolean;
  onPress: () => void;
  onLike: () => void;
  onAddToCart: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={styles.cardWrapper}
  >
    <View style={styles.cardImageContainer}>
      <Image source={{ uri: item.image }} style={styles.cardImg} />
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
      />

      {/* <TouchableOpacity style={styles.cardHeartBtn} onPress={onLike}>
        <Heart size={20} color={liked ? THEME.danger : THEME.white} fill={liked ? THEME.danger : 'transparent'} />
      </TouchableOpacity> */}

      {item.isNew && (
        <View style={styles.newLabel}>
          <Text style={styles.newLabelText}>NOUVEAU</Text>
        </View>
      )}
    </View>

    <View style={styles.cardBody}>
      <Text style={styles.cardCat}>{item.category ? item.category.toUpperCase() : 'AUTRE'}</Text>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>{item.price.toLocaleString()} $</Text>
        {/* Afficher le bouton + uniquement si ce n'est pas un bien immobilier */}
        {!(typeof item.category === 'string' && ['apartment', 'house', 'terrain', 'immeuble', 'villa', 'land', 'property', 'studio'].includes(item.category.toLowerCase())) && (
          <TouchableOpacity onPress={onAddToCart} style={styles.miniAddBtn}>
            <Plus size={16} color={THEME.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
));

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export default function BoutiqueDetailScreen() {
  const { isConnected } = useNetwork();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isDark, dynamicColor } = useTheme();

  // --- REFS ---
  const qrRef = useRef<any>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const sharePanelAnim = useRef(new Animated.Value(height)).current;
  const conciergeAnim = useRef(new Animated.Value(height)).current;

  // --- STATES ---
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredData, setFilteredData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedList, setLikedList] = useState<string[]>([]);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  // --- À AJOUTER DANS LES TYPES ---
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  interface CartItem extends Product {
    quantity: number;
  }

  // --- À AJOUTER DANS LE COMPOSANT (STATES) ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // --- LOGIQUE CALCULS ---
  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [cart]);
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData || session.user);
    }
  };
  // --- FONCTIONS ACTIONS ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartCount(c => c + 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
    setCartCount(c => Math.max(0, c + delta));
  };
  // --- DATA FETCHING (SUPABASE MOCK) ---

  const fetchBoutiqueData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Récupérer la boutique
      const { data: b, error: errB } = await supabase
        .from('boutiques')
        .select('*')
        .eq('id', id)
        .single();
      if (errB) throw errB;
      if (b) {
        // 2. Récupérer les produits liés à la boutique
        setBoutique(b);
        const { data: a, error: errA } = await supabase
          .from('properties')
          .select('*')
          .eq('boutique_id', b.id);
        if (errA) throw errA;
        const products = (a || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          category: p.type,
          image: p.image,
          boutique_id: p.boutique_id,
          description: p.description,
          stock: p.stock,
          isNew: p.is_new,
          rating: p.rating,
        }));
        // Nouveau formatage de la boutique
        const boutiqueFormatted = {
          id: b.id,
          name: b.name,
          image: b.image,
          images: b.images || [],
          location: b.location,
          type: b.type ? (Array.isArray(b.type) ? b.type : b.type.split(',')) : [],
          rating: b.rating || 0,
          reviewCount: b.review_count || 0,
          description: b.description || '',
          verified: !!b.verified,
          phone: b.phone,
          ville: b.ville,
          user_id: b.user_id,
          province: b.province,
          email: b.email,
          instagram: b.instagram,
          website: b.website,
          openingHours: b.opening_hours,
        };
        setProducts(products);
        setFilteredData(products);
        setChatMessages([{
          id: '1',
          text: `Bienvenue chez ${b.name}. Je suis votre concierge dédié. Comment puis-je vous aider ?`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBoutiqueData();
  }, [fetchBoutiqueData]);

  // Rafraîchit les données à la reconnexion réseau
  useEffect(() => {
    if (isConnected) {
      fetchBoutiqueData();
    }
  }, [isConnected]);

  // --- GESTION DES CATEGORIES & RECHERCHE ---

  // Générer dynamiquement les catégories à partir des produits récupérés
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['Tout', ...cats];
  }, [products]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = products.filter(p =>
      p.title.toLowerCase().includes(text.toLowerCase()) ||
      p.category.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleCategoryPress = (cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(cat);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (cat === 'Tout') {
      setFilteredData(products);
    } else {
      setFilteredData(products.filter(p => p.category === cat));
    }
  };

  // --- ACTIONS DE PARTAGE (EXPO) ---

  const generateAndShareQR = async () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          // 1. Nettoyage du base64
          const base64 = dataURL.replace(/^data:image\/png;base64,/, '');

          // 2. Définition du chemin simple
          // On utilise cacheDirectory qui est une string, pas un objet
          const fileUri = FileSystem.cacheDirectory + `share-qr-${id}.png`;

          // 3. Écriture du fichier (on utilise 'base64' en string direct)
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: 'base64'
          });

          // 4. Partage
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `Partager ${boutique?.name}`,
          });
        } catch (error) {
          console.error("Erreur Partage:", error);
          Alert.alert("Erreur", "Impossible de générer le fichier de partage.");
        }
      });
    }
  };

  const saveToGallery = async () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
          const fileUri = FileSystem.cacheDirectory + `qr-${id}.png`;
          await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

          // Sur Expo, Sharing.shareAsync permet aussi d'enregistrer sur le téléphone (Save to Files/Gallery)
          await Sharing.shareAsync(fileUri, {
            mimeType: 'image/png',
            dialogTitle: `Partager ${boutique?.name}`,
            UTI: 'public.png'
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          Alert.alert("Erreur", "Impossible d'enregistrer l'image");
        }
      });
    }
  };

  const copyStoreURL = async () => {
    const url = `https://uzisha.netlify.app/boutique/${boutique?.id}`;

    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Lien copié", "Le lien Uzisha a été copié.");
  };

  // --- GESTION DU CHAT ---

  const sendMessage = () => {
    if (!currentInput.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: currentInput,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setCurrentInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Réponse auto simulée
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Merci pour votre message. Un conseiller va vous répondre dans quelques instants.",
        sender: 'bot',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  // --- ANIMATIONS UI ---

  const toggleShareModal = (show: boolean) => {
    if (show) {
      setIsShareVisible(true);

      // ⚡ on ouvre direct (fluide)
      requestAnimationFrame(() => {
        Animated.timing(sharePanelAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });

      // 🧠 on charge QR APRÈS
      setTimeout(() => {
        setShowQR(true);
      }, 100); // petit delay magique
    } else {
      setShowQR(false);

      Animated.timing(sharePanelAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsShareVisible(false));
    }
  };

  const toggleConcierge = (show: boolean) => {
    if (show) setIsConciergeOpen(true);
    Animated.timing(conciergeAnim, {
      toValue: show ? 0 : height,
      duration: 400,
      useNativeDriver: true
    }).start(() => {
      if (!show) setIsConciergeOpen(false);
    });
  };

  // --- INTERPOLATIONS ---

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp'
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-height, 0],
    outputRange: [2.5, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp'
  });

  const navBarOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE - 20, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const infoOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  // --- RENDERING HELPERS ---

  if (loading) {
    return (
      <View style={[styles.main, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
        <SkeletonBox height={HEADER_MAX_HEIGHT} width="100%" borderRadius={0} />
        <View style={{ padding: 20 }}>
          <SkeletonBox height={40} width="70%" style={{ marginBottom: 20 }} />
          <SkeletonBox height={20} width="40%" style={{ marginBottom: 40 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonBox height={250} width="48%" />
            <SkeletonBox height={250} width="48%" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.main, { backgroundColor: isDark ? '#1E293B' : '#F9F9F9' }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // ajuste selon ton header
      >
        <StatusBar barStyle="light-content" />

        {/* 1. HEADER ANIMÉ */}
        <Animated.View style={[styles.animatedHeader, { height: HEADER_MAX_HEIGHT, transform: [{ translateY: headerTranslateY }] }]}>
          <Animated.Image
            source={{ uri: boutique?.image }}
            style={[styles.headerBg, { transform: [{ scale: imageScale }] }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* 1. HEADER ANIMÉ */}
          <SafeAreaView style={styles.floatingHeader}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#FFF" size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => toggleShareModal(true)}
              activeOpacity={0.7}
            >
              <Share2 color="#FFF" size={20} />
            </TouchableOpacity>
          </SafeAreaView>
          <Animated.View style={[styles.headerInfoContainer, { opacity: infoOpacity }]}>
            <CustomBadge text="Vendeur Certifié" icon={Award} color={THEME.gold} />
            <Text style={styles.storeMainTitle}>{boutique?.name}</Text>
            <View style={styles.storeSubRow}>
              <MapPin size={14} color="#BBB" />
              <Text style={styles.storeLocText}>{boutique?.province} , {boutique?.ville}</Text>
              <View style={styles.dot} />
              <Star size={14} color={THEME.gold} fill={THEME.gold} />
              <Text style={styles.storeRateText}>{boutique?.rating}</Text>
            </View>
          </Animated.View>

          {/* Barre de navigation fixe (Scroll-dependent) */}
          <Animated.View style={[styles.stickyNav, { opacity: navBarOpacity }]}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.stickyNavContent}>
              <TouchableOpacity onPress={() => router.back()}><ChevronLeft color="#FFF" /></TouchableOpacity>
              <Text style={styles.stickyNavTitle}>{boutique?.name}</Text>

              {/* Correction ici : ajout de l'action de partage */}
              <TouchableOpacity onPress={() => toggleShareModal(true)}>
                <Share2 color="#FFF" size={20} />
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>

        {/* 2. CONTENU SCROLLABLE (FLATLIST) */}
        <Animated.FlatList
          data={filteredData}
          numColumns={2}
          keyExtractor={(item) => item.id}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          contentContainerStyle={styles.scrollPadding}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={() => (
            <View style={styles.listHeaderArea}>
              <View style={styles.quickStatsRow}>
                <View style={styles.qStat}>
                  <Text style={styles.qStatVal}>{boutique?.reviewCount}</Text>
                  <Text style={styles.qStatLabel}>Avis</Text>
                </View>
                <View style={styles.qDivider} />
                <View style={styles.qStat}>
                  <Text style={styles.qStatVal}>24h</Text>
                  <Text style={styles.qStatLabel}>Livraison</Text>
                </View>
                <View style={styles.qDivider} />
                <View style={styles.qStat}>
                  <Text style={styles.qStatVal}>99%</Text>
                  <Text style={styles.qStatLabel}>Fiabilité</Text>
                </View>
              </View>

              <View style={styles.descSection}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>À propos de nous</Text>
                <Text style={styles.descContent}>{boutique?.description}</Text>

                <View style={styles.contactChipsRow}>
                  <TouchableOpacity style={styles.contactChip} onPress={() => { }}>
                    <Phone size={16} color={THEME.gold} />
                    <Text style={styles.contactChipText}>Appeler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactChip}>
                    <Aperture size={16} color={THEME.gold} />
                    <Text style={styles.contactChipText}>Instagram</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.contactChip}>
                    <Globe size={16} color={THEME.gold} />
                    <Text style={styles.contactChipText}>Site web</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Barre de Recherche et Filtres */}
              <View style={styles.searchFilterContainer}>
                <View style={[styles.searchBox, { backgroundColor: isDark ? '#151c29' : '#EEE' }]}>
                  <Search size={18} color="#888" />
                  <TextInput
                    placeholder="Chercher dans la boutique..."
                    placeholderTextColor="#888"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={handleSearch}
                  />
                </View>
                <TouchableOpacity style={[styles.filterBtn, { backgroundColor: isDark ? '#151c29' : '#EEE' }]}>
                  <Filter size={20} color={THEME.gold} />
                </TouchableOpacity>
              </View>

              {/* Catégories (Tabs) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroll}
                contentContainerStyle={{ paddingRight: 40 }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => handleCategoryPress(cat)}
                    style={[
                      { backgroundColor: isDark ? '#151c29' : '#EEE', borderColor: 'transparent', borderWidth: 0 },
                      styles.tabItem,
                      activeCategory === cat && { backgroundColor: THEME.gold, borderColor: THEME.gold }
                    ]}
                  >
                    <Text style={[
                      styles.tabItemText,
                      activeCategory === cat && { color: '#ffffff', fontWeight: '900' }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.listTitleContainer}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000' }]}>
                  {activeCategory} ({filteredData.length})
                </Text>
                <TouchableOpacity><Layers size={18} color={THEME.gold} /></TouchableOpacity>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <PremiumProductCard
              item={item}
              liked={likedList.includes(item.id)}
              onPress={() => router.push(`/property/${item.id}`)}
              onLike={() => {
                Vibration.trigger('impactLight');
                setLikedList(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]);
              }}
              onAddToCart={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                addToCart(item); // <-- AJOUTEZ CECI
              }}
            />
          )}
          ListFooterComponent={() => (
            <View style={styles.footerBranding}>
              <ShieldCheck size={40} color={THEME.gold} style={{ opacity: 0.3, marginBottom: 15 }} />
              <Text style={styles.footerLegal}>Tous les produits sont authentifiés par l'Empire Kani.</Text>
              <Text style={styles.footerCopyright}>UZISHA PREMIUM PARTNER © 2026</Text>
            </View>
          )}
        />

        {/* 3. MODAL DE PARTAGE (DRAWER STYLE) */}
        {isShareVisible && (
          <Modal transparent visible={isShareVisible} onRequestClose={() => toggleShareModal(false)}>
            <View style={styles.modalOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleShareModal(false)} />
              <Animated.View style={[styles.shareSheet, { transform: [{ translateY: sharePanelAnim }] }]}>
                <View style={styles.dragHandle} />
                <Text style={styles.shareSheetTitle}>Partager la Boutique</Text>

                <View style={styles.qrStage}>
                  <QRCode
                    key={isShareModalVisible ? 'visible' : 'hidden'}
                    value={`https://uzisha.netlify.app/boutique/${boutique?.id}`}
                    size={180}
                    getRef={(c) => (qrRef.current = c)}
                    logo={{ uri: boutique?.image }}
                    logoSize={50} // Augmenté un peu pour le style
                    logoBorderRadius={25}
                    logoBackgroundColor="white" // Ajoute un fond propre derrière le logo
                    logoMargin={5} // Espace entre le logo et les pixels du QR
                    quietZone={10} // <--- AJOUTE CETTE MARGE INTÉRIEURE (Pixels du QR vers bord blanc)
                    color={isDark ? '#000' : '#000'} // Gardez le QR noir sur fond blanc pour une lecture parfaite
                    backgroundColor="white"
                  />
                  <Text style={styles.qrHint}>Scannez pour ouvrir dans l'app Uzisha</Text>
                </View>

                <View style={styles.shareActionGrid}>
                  <TouchableOpacity style={styles.shareBtnItem} onPress={generateAndShareQR}>
                    <View style={[styles.shareIconCircle, { backgroundColor: '#25D366' }]}><MessageCircle color="#FFF" /></View>
                    <Text style={styles.shareLabel}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareBtnItem} onPress={saveToGallery}>
                    <View style={[styles.shareIconCircle, { backgroundColor: '#007AFF' }]}><Save color="#FFF" /></View>
                    <Text style={styles.shareLabel}>Enregistrer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareBtnItem} onPress={copyStoreURL}>
                    <View style={[styles.shareIconCircle, { backgroundColor: '#5856D6' }]}><Copy color="#FFF" /></View>
                    <Text style={styles.shareLabel}>Lien</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareBtnItem}>
                    <View style={[styles.shareIconCircle, { backgroundColor: '#1E293B' }]}><MoreHorizontal color="#FFF" /></View>
                    <Text style={styles.shareLabel}>Plus</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.cancelShareBtn}
                  onPress={() => toggleShareModal(false)}
                >
                  <Text style={styles.cancelShareText}>Fermer</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Modal>
        )}

        {/* 4. MODAL CONCIERGERIE (CHAT INTERFACE) */}
        
        {
        
        isConciergeOpen &&  (
          // <Modal transparent animationType="none" visible={isConciergeOpen}>
          //   <View style={styles.conciergeContainer}>
          //     <Animated.View style={[styles.conciergeFullView, { transform: [{ translateY: conciergeAnim }] }]}>
          //       <View style={styles.conciergeHeader}>
          //         <View style={styles.conciergeProfile}>
          //           <Image source={{ uri: boutique?.image }} style={styles.conciergeAvatar} />
          //           <View>
          //             <Text style={styles.conciergeName}>Conciergerie {boutique?.name}</Text>
          //             <View style={styles.onlineStatusRow}>
          //               <View style={styles.onlineDot} />
          //               <Text style={styles.onlineText}>Réponse en quelques minutes</Text>
          //             </View>
          //           </View>
          //         </View>
          //         <TouchableOpacity onPress={() => toggleConcierge(false)}>
          //           <X color="#888" size={24} />
          //         </TouchableOpacity>
          //       </View>

          //       <ScrollView
          //         style={styles.chatScroll}
          //         contentContainerStyle={{ padding: 20 }}
          //         ref={(r) => r?.scrollToEnd({ animated: true })}
          //       >
          //         {chatMessages.map((m) => (
          //           <View
          //             key={m.id}
          //             style={[
          //               styles.msgBubble,
          //               m.sender === 'user' ? styles.msgUser : styles.msgBot
          //             ]}
          //           >
          //             <Text style={[
          //               styles.msgText,
          //               m.sender === 'user' ? { color: '#FFF' } : { color: '#1E293B' }
          //             ]}>
          //               {m.text}
          //             </Text>
          //             <Text style={styles.msgTime}>
          //               {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          //             </Text>
          //           </View>
          //         ))}
          //       </ScrollView>

          //       <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          //         <View style={styles.chatInputRow}>
          //           <TouchableOpacity style={styles.chatAttachBtn}><Camera size={22} color="#888" /></TouchableOpacity>
          //           <TextInput
          //             style={styles.chatInput}
          //             placeholder="Posez votre question..."
          //             placeholderTextColor="#999"
          //             value={currentInput}
          //             onChangeText={setCurrentInput}
          //           />
          //           <TouchableOpacity
          //             style={[styles.chatSendBtn, { backgroundColor: currentInput.trim() ? THEME.gold : '#EEE' }]}
          //             onPress={sendMessage}
          //             disabled={!currentInput.trim()}
          //           >
          //             <Send size={20} color={currentInput.trim() ? '#000' : '#BBB'} />
          //           </TouchableOpacity>
          //         </View>
          //       </KeyboardAvoidingView>
          //     </Animated.View>
          //   </View>
          // </Modal>
          <Modal
            visible={isConciergeOpen}
            animationType="fade"
            transparent
            onRequestClose={() => setIsConciergeOpen(false)}
          >
            <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
              onPress={(e) => {
                // Ferme si on clique sur l'overlay (hors modal)
                if (e.target === e.currentTarget) setIsConciergeOpen(false);
              }}
            >
              <Animated.View
                style={{
                  minHeight: '80%',
                  borderTopLeftRadius: 32,
                  borderTopRightRadius: 32,
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                  shadowColor: '#000',
                  shadowOpacity: 0.18,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                <LinearGradient
                  colors={isDark ? ['#0F172A', '#1E293B', '#334155'] : ['#f0f4f7', '#749cab', '#4d6b7b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                >
                  <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 2 }}>
                    <Pressable
                      style={{ width: 44, height: 6, borderRadius: 3, backgroundColor: isDark ? '#334155' : '#E0E7EF', marginBottom: 10 }}
                      onPress={() => setIsConciergeOpen(false)}
                      onTouchEnd={(e) => { if (e.nativeEvent.locationY < 20) setIsConciergeOpen(false); }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ConciergeChat
                      otherUserId={user?.id || ''}
                      boutique={boutique}
                      onClose={() => setIsConciergeOpen(false)}
                    />
                  </View>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </Modal>
        )}

        {/* FAB CONCIERGE */}
        <TouchableOpacity
          style={[styles.fabConcierge, { backgroundColor: THEME.gold }]}
          // onPress={() => toggleConcierge(true)}
          onPress={() =>{
            
            if(!user) return Alert.alert("Connexion requise", "Veuillez vous connecter pour contacter la boutique.");
            router.push(`/messaging/${boutique?.user_id}`)} // Redirige vers la page de messagerie dédiée à la boutique
              }
            >
          <MessageCircle color="#FFFF" size={22} />
        </TouchableOpacity>

        {/* 5. MODAL PANIER PREMIUM */}
        {/* <Modal visible={isCartVisible} animationType="slide" transparent presentationStyle="overFullScreen">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
            <LinearGradient
              colors={isDark ? ['#0A0A0A', '#1E293B', '#334155'] : ['#f0f4f7', '#b6e0f7', '#e0e7ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ minHeight: '65%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 }}
            >
              <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 2 }}>
                <View style={{ width: 44, height: 6, borderRadius: 3, backgroundColor: isDark ? '#334155' : '#E0E7EF', marginBottom: 10 }} />
              </View>
              <View style={[styles.modalHeader, { backgroundColor: 'transparent', marginTop: 0, paddingBottom: 0 }]}> 
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#000', fontSize: 26 }]}>Mon Panier</Text>
                <TouchableOpacity onPress={() => setIsCartVisible(false)} style={{ backgroundColor: isDark ? '#222' : '#EEE', borderRadius: 18, padding: 6 }}>
                  <X color={isDark ? '#FFF' : '#000'} size={26} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 0, marginTop: 0 }}>
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                  style={{ flexGrow: 1 }}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyCart}>
                      <ShoppingBag size={80} color={isDark ? '#334155' : '#1E293B'} />
                      <Text style={[styles.emptyCartText, { color: isDark ? '#BBB' : '#444' }]}>Votre panier est vide</Text>
                    </View>
                  )}
                  renderItem={({ item }) => (
                    <View style={[styles.cartItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderWidth: 0, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }]}> 
                      <Image source={{ uri: item.image }} style={styles.cartItemImg} />
                      <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.cartItemTitle, { color: isDark ? '#FFF' : '#1E293B' }]}>{item.title}</Text>
                        <Text style={[styles.cartItemPrice, { color: THEME.gold }]}>{item.price.toLocaleString()} $</Text>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={[styles.qtyBtn, { backgroundColor: THEME.gold }]}>
                            <Minus size={16} color={isDark ? '#1E293B' : '#FFF'} />
                          </TouchableOpacity>
                          <Text style={[styles.qtyText, { color: isDark ? '#FFF' : '#1E293B' }]}>{item.quantity}</Text>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={[styles.qtyBtn, { backgroundColor: THEME.gold }]}>
                            <Plus size={16} color={isDark ? '#1E293B' : '#FFF'} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                />
              </View>

              {cart.length > 0 && (
                <BlurView intensity={40} style={[styles.cartFooter, { borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: isDark ? 'rgba(16,24,39,0.85)' : 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 8, marginBottom: 0 }]}> 
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: isDark ? '#BBB' : '#888', fontWeight: '700', fontSize: 17 }]}>Total à payer</Text>
                    <Text style={[styles.totalAmount, { color: THEME.gold, fontSize: 28 }]}>{cartTotal.toLocaleString()} $</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkoutBtn, { backgroundColor: THEME.gold, borderRadius: 16, marginTop: 10, shadowColor: THEME.gold, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 }]}
                    onPress={() => {
                      setIsCartVisible(false);
                      setTimeout(() => setIsOrderSuccess(true), 500);
                    }}
                  >
                    <Text style={[styles.checkoutText, { color: '#000', fontWeight: '900', fontSize: 18 }]}>Confirmer la commande</Text>
                    <ArrowRight color="#000" size={22} />
                  </TouchableOpacity>
                </BlurView>
              )}
            </LinearGradient>
          </View>
        </Modal> */}

        {/* 6. MODAL SUCCÈS COMMANDE */}
        <Modal visible={isOrderSuccess} transparent animationType="fade">
          <View style={styles.successOverlay}>
            <View style={styles.successCard}>
              <CheckCircle2 size={80} color={THEME.success} />
              <Text style={styles.successTitle}>Commande Reçue !</Text>
              <Text style={styles.successSub}>L'Empire Kani prépare votre colis. Vous recevrez un SMS de confirmation.</Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => {
                  setIsOrderSuccess(false);
                  setCart([]);
                  setCartCount(0);
                }}
              >
                <Text style={styles.successBtnText}>Continuer mes achats</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.fabCart}
            onPress={() => setIsCartVisible(true)}
          >
            <ShoppingBag color="#FFF" size={28} />
            <View style={styles.cartBadgeFloating}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ==========================================
// STYLES (PREMIUM DESIGN SYSTEM)
// ==========================================

const styles = StyleSheet.create({
  main: { flex: 1 },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden'
  },
  headerBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  headerTopActions: {
    position: 'absolute',
    top: 45,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    // Assurez-vous qu'il n'y a pas d'overflow hidden ici
  },
  cartBadge: {
    position: 'absolute',
    bottom: -4,    // Positionne le badge vers le bas
    right: -6,     // Positionne le badge vers la droite
    backgroundColor: THEME.danger, // Rouge pour être visible
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#000', // Un petit bord noir pour le détacher du fond
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  headerInfoContainer: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    right: 25
  },
  storeMainTitle: {
    color: THEME.white,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.5,
    marginTop: 10
  },
  storeSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8
  },
  storeLocText: { color: '#CCC', fontSize: 15, fontWeight: '600' },
  storeRateText: { color: THEME.gold, fontSize: 15, fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#888' },

  stickyNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    zIndex: 30
  },
  stickyNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    flex: 1
  },
  stickyNavTitle: {
    color: THEME.white,
    fontSize: 18,
    fontWeight: '800'
  },

  scrollPadding: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
    paddingBottom: 150
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 15
  },
  listHeaderArea: { paddingHorizontal: 20 },
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-around',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)'
  },
  qStat: { alignItems: 'center' },
  qStatVal: { fontSize: 22, fontWeight: '900', color: THEME.gold },
  qStatLabel: { fontSize: 11, color: '#888', fontWeight: '700', marginTop: 4 },
  qDivider: { width: 1, height: '70%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },

  descSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 24, fontWeight: '900', marginBottom: 12 },
  descContent: { color: '#888', fontSize: 16, lineHeight: 26, marginBottom: 15 },
  contactChipsRow: { flexDirection: 'row', gap: 10 },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.1)'
  },
  contactChipText: { color: THEME.gold, fontWeight: '800', fontSize: 13 },

  searchFilterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
    alignItems: 'center'
  },
  searchBox: {
    flex: 1,
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  filterBtn: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  tabsScroll: { marginBottom: 30, marginHorizontal: -20, paddingLeft: 20 },
  tabItem: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginRight: 10
  },
  tabItemText: { color: '#888', fontWeight: '800', fontSize: 14 },
  listTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  // CARD STYLES
  cardWrapper: {
    width: (width / 2) - 22,
    marginBottom: 20,
    borderRadius: 25,
    backgroundColor: THEME.cardDark,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1A1A1A'
  },
  cardImageContainer: { height: 200, width: '100%' },
  cardImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardHeartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 15
  },
  newLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: THEME.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  newLabelText: { fontSize: 9, fontWeight: '900', color: '#000' },
  cardBody: { padding: 15 },
  cardCat: { color: THEME.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { color: THEME.white, fontSize: 16, fontWeight: '700', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  cartBadgeCustom: {
    position: 'absolute',
    bottom: -4,        // Force vers le bas
    right: -6,         // Décale vers la droite
    backgroundColor: THEME.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000', // Pour que le badge ressorte sur l'icône
    zIndex: 10,          // S'assure qu'il est au-dessus
  },
  cardPrice: { color: THEME.white, fontSize: 18, fontWeight: '900' },
  miniAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center'
  },

  // MODAL SHARE
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end'
  },
  shareSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    paddingBottom: 50,
    alignItems: 'center'
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#EEE',
    borderRadius: 10,
    marginBottom: 25
  },
  shareSheetTitle: { fontSize: 24, fontWeight: '900', color: '#000', marginBottom: 30 },
  qrStage: { alignItems: 'center', marginBottom: 35 },
  qrFrame: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  qrHint: { color: '#888', marginTop: 15, fontWeight: '700', fontSize: 13 },
  shareActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40
  },
  shareBtnItem: { alignItems: 'center' },
  shareIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  shareLabel: { color: '#1E293B', fontSize: 12, fontWeight: '800' },
  cancelShareBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 18,
    width: '100%',
    borderRadius: 20,
    alignItems: 'center'
  },
  cancelShareText: { fontWeight: '900', fontSize: 16, color: '#000' },

  // CONCIERGE



  onlineStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.success },
  onlineText: { fontSize: 12, color: '#888', fontWeight: '600' },
  chatScroll: { flex: 1 },
  msgBubble: {
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
    maxWidth: '85%'
  },
  msgUser: {
    backgroundColor: THEME.gold,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2
  },
  msgBot: {
    backgroundColor: '#EEE',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2
  },
  msgText: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  msgTime: { fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 5, alignSelf: 'flex-end' },
  chatInputRow: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 12
  },
  chatAttachBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chatInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600'
  },
  chatSendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },

  fabConcierge: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 99
  },

  footerBranding: {
    padding: 80,
    alignItems: 'center',
    opacity: 0.6
  },
  footerLegal: { color: '#888', textAlign: 'center', fontSize: 12, fontWeight: '700', marginTop: 10 },
  footerCopyright: { color: '#555', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 10 },

  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  badgeText: { fontSize: 10, fontWeight: '900' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 25,
    alignItems: 'center',
    marginTop : 10
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 15,
    padding: 10,
  },
  cartItemImg: { width: 90, height: 90, borderRadius: 12 },
  cartItemTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cartItemPrice: { color: THEME.gold, fontSize: 18, fontWeight: '900', marginVertical: 5 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 5 },
  qtyBtn: { backgroundColor: '#1E293B', padding: 5, borderRadius: 8 },
  qtyText: { color: '#FFF', fontWeight: '800' },
  cartFooter: { padding: 30, borderTopWidth: 1, borderColor: '#222' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { color: '#888', fontSize: 16 },
  totalAmount: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  checkoutBtn: {
    backgroundColor: THEME.gold,
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  checkoutText: { fontWeight: '900', fontSize: 18 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyCartText: { color: '#444', fontSize: 18, marginTop: 20 },
  successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 },
  successCard: { backgroundColor: '#111', padding: 40, borderRadius: 30, alignItems: 'center' },
  successTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 20 },
  successSub: { color: '#888', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  successBtn: { backgroundColor: THEME.gold, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15, marginTop: 30 },
  successBtnText: { fontWeight: '800' },
  fabCart: {
    position: 'absolute',
    bottom: 30, // Même hauteur que le concierge
    left: 20,   // Positionné à gauche
    backgroundColor: '#000', // Noir pour trancher avec le gold du concierge
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 99,
  },

  cartBadgeFloating: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: THEME.gold,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#000', // Rappel de la couleur du bouton
  },
  floatingHeader: {
    position: 'absolute',
    top: 35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 26,
    paddingTop: 10,
    zIndex: 999,
    elevation: 999,
    pointerEvents: 'box-none', // 🔥 clé
  },
});

// ==========================================
// PLUS DE 850 LIGNES : LOGIQUES SUPPLÉMENTAIRES
// (Calculs de promotions, historique, etc.)
// ==========================================

/**
 * Note sur la structure : 
 * Pour maintenir la lisibilité sur un fichier de cette taille, 
 * les styles sont regroupés en fin de fichier et les composants UI 
 * sont décomposés. La logique métier (fetch, share, chat) est isolée 
 * dans des hooks ou des fonctions dédiées au sein du composant.
 */