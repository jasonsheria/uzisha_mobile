// Convertit une couleur hexadécimale ou nommée en rgba (pour Animated)
function toRgba(color: string, alpha: number = 1): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Si déjà rgba ou autre format, retourne tel quel
  return color;
}
// Utilitaire pour ajouter de l'alpha à une couleur hexadécimale #RRGGBB
function addAlpha(hexColor: string, alpha: string = '33') {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) return hexColor;
  return hexColor + alpha;
}
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  // Replace import from 'react-native' with 'react-native-safe-area-context'
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Color, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PropertyCategories } from '@/constants/PropertyCategories';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { BOUTIQUE, Property, PropertyType } from '@/types';
import { supabase } from '@/utils/supabase'; // Assurez-vous que le chemin est correct
// Composants internes (Assurez-vous qu'ils existent ou remplacez par des Views)
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { Header } from '@/components/Header';
import { useColorScheme } from '@/components/useColorScheme';
import Preloader from '@/components/Preloader';
import BoutiqueCard from '@/components/Boutique';
const { width, height } = Dimensions.get('window');
const hause = require('../../assets/images/desin.jpg');
const apartment = require('../../assets/images/ear.jpg');
const land = require('../../assets/images/terrain.jpg');
const restaurant = require('../../assets/images/as.jpg');
const eventSpace = require('../../assets/images/qs.jpg');
const gym = require('../../assets/images/qss.jpg');
const supermarket = require('../../assets/images/supermarche.jpg');
const immo = require('../../assets/images/immo.jpg');
const HERO_HEIGHT = 420;
import Presentation from '@/components/Presentation';
import AgenceImmoCard from '@/components/AgenceImmoCard';
import { useTheme } from '@/contexts/ThemeContext';
import { DynamicIcon } from '@/components/DynamicIcon';
import { useAuthContext } from '@/contexts/AuthContext';
const partenaires = require('../../assets/images/partenaire.jpg');
interface Category {
  id: PropertyType;
  label: string;
  color: string;
}
const HEADER_MAX_HEIGHT = height * 0.6;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 120 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
import { useFocusEffect } from '@react-navigation/native';
// --- COMPOSANTS ATOMIQUES ---

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// 1. Modifiez votre SkeletonPulse pour qu'il accepte des styles personnalisés

interface Articles {
  id: string;
  title: string;
  type: 'house' | 'apartment' | 'land' | 'restaurant' | 'event-space' | 'gym' | 'supermarket';
  listingType: 'sale' | 'rental';
  price: number;
  visitPrice: number;
  location: string;
  description: string;
  image: string;
  images?: string[];
  videos?: string[];
  beds?: number;
  baths?: number;
  area?: number;
  parking_spaces?: number;
  living_area?: number;
  kitchen_area?: number;
  features?: string[];
  userId?: string;
  createdAt: string;
  details?: Record<string, any>;
  reviews: 9
}

interface AgenceProps {
  name?: string;               // Le '?' rend la propriété optionnelle
  image?: string;
  rating?: number;
  totalProperties?: number;
  location?: string;
  specialty?: string;
  isVerified?: boolean;
  onPress?: () => void;
  isDark: boolean;             // Gardez celle-ci obligatoire si nécessaire
}

/** * --- COMPOSANTS AUXILIAIRES ---
 */

// Composant pour les bannières publicitaires - PREMIUM ANIMATED

// Composant bannière agence - PREMIUM ANIMATED


// Fonction pour rendre les propriétés en grille selon le mode de visualisation
const renderPropertiesInGrid = (properties: Property[], viewMode: number, isDark: boolean) => {
  let colsCount = viewMode === 1 ? 1 : viewMode === 2 ? 2 : 3;
  const rows: Property[][] = [];

  for (let i = 0; i < properties.length; i += colsCount) {
    rows.push(properties.slice(i, i + colsCount));
  }

  return rows.map((row, rowIdx) => (
    <View key={rowIdx} style={[styles.propertyRow, { gap: viewMode > 1 ? 10 : 0 }]}>
      {row.map((item, idx) => (
        <MotiView
          key={item.id}
          from={{ opacity: 0, transform: [{ translateY: 30 }] }}
          animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
          exit={{ opacity: 0, transform: [{ scale: 0.9 }] }}
          transition={{ delay: (rowIdx * colsCount + idx) * 80 }}
          style={{ flex: 1 }}
        >
          <PropertyCard
            property={item}
            onPress={() => router.push(`/property/${item.id}`)}
          />
        </MotiView>
      ))}
      {row.length < colsCount &&
        Array.from({ length: colsCount - row.length }).map((_, i) => (
          <View key={`empty-${i}`} style={{ flex: 1 }} />
        ))}
    </View>
  ));
};

/** * --- MAIN SCREEN COMPONENT ---
 */
export default function HomeScreen() {
  // Animation du changement de thème

  // State dynamique pour les boutiques
  const [boutiques, setBoutiques] = useState<BOUTIQUE[]>([]);
  const [loadingBoutiques, setLoadingBoutiques] = useState(true);

  // Fonction pour charger les boutiques depuis Supabase
  const loadBoutiques = async () => {
    try {
      setLoadingBoutiques(true);
      const { data, error } = await supabase
        .from('boutiques')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        console.error('[Load Boutiques Error]:', error);
        return;
      }
      setBoutiques(data || []);
    } catch (error) {
      console.error('[Load Boutiques Exception]:', error);
    } finally {
      setLoadingBoutiques(false);
    }
  };

  // Charger les boutiques au montage
 useEffect(() => {
  loadArticles();
  loadBoutiques();
}, []); 

  const { isDark, toggleTheme, dynamicColor } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PropertyType | null>(null);
  const [articles, setArticles] = useState<Articles[]>([]);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const [viewMode, setViewMode] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const themeAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const { user } = useAuthContext();

  const SkeletonPulse = ({ style }: { style?: any }) => {
    const isDark = useColorScheme() === 'dark';
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.skeleton,
          {
            opacity,
            backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0' // Couleurs plus contrastées
          },
          style,
        ]}
      />
    );
  };
  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDark ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const bgColor = themeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [toRgba('#F8FAFC', 1), toRgba('#0F172A', 1)],
  });

  useEffect(() => {
    // Simule le chargement des données (remplacez par votre logique réelle)
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);
  
  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select(`
        *,
        agent:user_id (
          id,
          name,
          phone,
          avatar
        )
      `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('[Load Articles Error]:', error);
        return;
      }

      const formattedArticles: Property[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        listingType: item.listing_type,
        price: item.price,
        location: item.location,
        image: item.image,
        images: Array.isArray(item.images) ? item.images : [item.image],
        beds: item.beds,
        baths: item.baths,
        area: item.area,
        // On s'assure que l'agent est bien structuré pour le composant PropertyCard
        agent: item.agent || {
          id: 'default',
          name: 'Agent eMobilier',
          phone: 'Contact non dispo',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
        },
        // Champs additionnels demandés par votre structure
        reviews: item.reviews_count || 10,
        rating: item.avg_rating || 4,
        details: item.details || {},
      }));

      // CRUCIAL : On met à jour 'properties' car c'est elle qui est filtrée
      setProperties(formattedArticles);

    } catch (error) {
      console.error('[Load Articles Exception]:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveServiceIndex(prev => (prev + 1) % 3);
      carouselRef.current?.scrollTo({
        x: ((activeServiceIndex + 1) % 3) * (width * 0.85 + 20),
        animated: true
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [activeServiceIndex]);

  // Filtrage
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchSearch =
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = !selectedCategory || p.type === selectedCategory;

      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategory, properties]);

  const handleCategoryPress = useCallback((id: PropertyType) => {
    setSelectedCategory(prev => prev === id ? null : id);
  }, []);
  const handlegoboutique = (id: string) => {
    router.push(`/boutique/${id}`);
  }
  const getCategoryIcon = (categoryId: string): string => {
    const iconMap: Record<string, string> = {
      'house': 'home',
      'apartment': 'domain',
      'land': 'tree',
      'restaurant': 'silverware-fork-knife',
      'event-space': 'party-popper',
      'gym': 'dumbbell',
      'supermarket': 'shopping',
      'telephone': 'phone',
      'clothing': 'tshirt-crew',
      'shoes': 'shoe-formal',
      'accessories': 'watch-variant',
      'other': 'dots-horizontal'
    };
    return iconMap[categoryId] || 'home';
  };
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF', flex: 1 }]}>
        {/* 2. On imite la hauteur du header pour éviter le saut visuel */}
        <SkeletonPulse style={{ height: HEADER_MAX_HEIGHT, borderRadius: 0 }} />

        <View style={styles.skeletonBody}>
          {/* Titre */}
          <SkeletonPulse style={{ width: '70%', height: 35, marginBottom: 30, marginTop: 10 }} />

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 40 }}>
            <SkeletonPulse style={{ flex: 1, height: 80, borderRadius: 20 }} />
            <SkeletonPulse style={{ flex: 1, height: 80, borderRadius: 20 }} />
            <SkeletonPulse style={{ flex: 1, height: 80, borderRadius: 20 }} />
          </View>

          {/* Grille de produits */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonPulse
                key={i}
                style={{
                  width: (width - 60) / 2, // Calculez pour correspondre à vos colonnes
                  height: 250,
                  borderRadius: 24,
                  marginBottom: 20
                }}
              />
            ))}
          </View>
        </View>
      </View>
    );
  }
  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>

        {/* <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} /> */}

        {/* <Header title="eMobilier" subtitle="L'excellence immobilière" /> */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          stickyHeaderIndices={[2]} // Rend la barre de recherche "semi-sticky"
        >

          <Presentation shouldReset={false} />
          {/* 2. ESPACE DE TRANSITION */}
          <View style={{ height: 10 }} />

          {/* BLOC RECHERCHE & SÉLECTEUR D'AFFICHAGE */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={[styles.stickySearch, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            {/* HEADER : LOGO + TITRE + ACTIONS */}
            <View style={styles.searchHeader}>
              <View style={styles.headerLeft}>
                {/* <Animated.View style={[styles.logoBadge, { backgroundColor: dynamicColor }]}> */}
                  {/* <MaterialCommunityIcons name="abacus" size={20} color="white" /> */}
                {/* </Animated.View> */}
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                  Uzisha
                </Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleTheme(); // Assurez-vous que toggleTheme est récupéré de useTheme()
                  }}
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                  <MaterialCommunityIcons
                    name={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
                    size={20}
                  />
                </TouchableOpacity>
                {/* Ajouter l'icon de notification */}
                <TouchableOpacity
                  onPress={() => router.push('/notifications')}
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                  <MaterialCommunityIcons name="bell-outline" size={20} color={isDark ? '#F1F5F9' : '#1E293B'} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(admin)')}
                  style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={isDark ? '#F1F5F9' : '#1E293B'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* BARRE DE RECHERCHE */}
            {/* <View style={styles.searchRow}>
            <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}> 
              <MaterialCommunityIcons name="magnify" size={24} color="#06B6D4" style={{ marginLeft: 15 }} />
              <TextInput
                placeholder="Rechercher..."
                placeholderTextColor="#94A3B8"
                style={[styles.searchInput, { color: isDark ? '#FFF' : '#0F172A' }]} 
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
              />
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFilters(true);
                }}
                style={styles.filterTrigger}
              >
                <MaterialCommunityIcons name="filter-variant" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View> */}

            {/* MODE D'AFFICHAGE */}
            {/* <View style={styles.viewModeContainer}>
              <Text style={[styles.viewModeLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>Style d'affichage</Text>
              <View style={styles.viewModeButtons}>
                {[
                  { id: 1, icon: 'view-agenda-outline' },
                  { id: 2, icon: 'view-grid-outline' },
                  { id: 3, icon: 'format-list-bulleted' }
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setViewMode(mode.id);
                    }}
                    style={[

                      // viewMode === mode.id && styles.modeBtnActive
                    ]}
                  >
                    <Animated.View style={[styles.modeBtn, { backgroundColor: viewMode === mode.id ? Colors.eventSpaceColor : isDark ? '#1E293B' : '#FFFFFF' }]}>
                      <MaterialCommunityIcons
                        name={mode.icon as any}
                        size={17}
                        color={viewMode === mode.id ? '#FFF' : isDark ? '#F1F5F9' : '#1E293B'}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>
            </View> */}
          </MotiView>
          {/* 4. CATÉGORIES REDESSINÉES - SANS ARRONDIS - PREMIUM ANIMATED */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 13 }}
              >
                <View>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#1E293B', marginBottom: 4 }]}>
                    Explorer par Type
                  </Text>
                  <Animated.Text style={[styles.categorySubtitle, { color: dynamicColor }]}>
                    Trouvez le bien qu'il vous faut
                  </Animated.Text>
                </View>
              </MotiView>
              <TouchableOpacity><Animated.Text style={[styles.seeAll, { color: dynamicColor }]}>Tous</Animated.Text></TouchableOpacity>
            </View>


            <View style={styles.section}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContent}
              >
                {PropertyCategories.map((category) => (
                  <MemoizedCategoryButton
                    key={category.id}
                    category={category}
                    isSelected={selectedCategory === category.id}
                    onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                    dynamicColor={dynamicColor}
                    getCategoryIcon={getCategoryIcon}
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          {/* 5. LISTING DES RÉSULTATS - MODE DE VISUALISATION MULTI-COLONNES - PREMIUM */}
          <View style={styles.resultsSection}>
            <MotiView
              from={{ opacity: 0, translateX: -30 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 13 }}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>
                  {selectedCategory ? `Résultats : ${filteredProperties.length}` : 'Populaire en ce moment'}
                </Text>
                <Text style={styles.resultCount}>{filteredProperties.length} biens</Text>
              </View>
            </MotiView>

            <AnimatePresence>
              {filteredProperties.length > 0 ? (
                <View style={styles.propertyGridContainer}>
                  {renderPropertiesInGrid(filteredProperties, viewMode, isDark)}
                </View>
              ) : (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 13 }}
                  style={styles.emptyState}
                >
                  <MotiView
                    from={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, mass: 0.8 }}
                  >
                    <MaterialCommunityIcons name="map-search-outline" size={90} color="#CBD5E1" />
                  </MotiView>
                  <Text style={styles.emptyText}>Aucun bien ne correspond à votre recherche</Text>
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={200}
                    transition={{ type: 'timing', duration: 600 }}
                  >
                    <TouchableOpacity
                      onPress={() => { setSearchQuery(''); setSelectedCategory(null); }}
                      style={styles.resetBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.resetText}>Réinitialiser les filtres</Text>
                    </TouchableOpacity>
                  </MotiView>
                </MotiView>
              )}
            </AnimatePresence>
          </View>
          <View style={styles.headerWrapper}>
            <View style={styles.badgePromo}>
              <DynamicIcon name="flash" size={14} />
              <Text style={[styles.badgePromoText]}>SÉLECTION EXCLUSIVE</Text>
            </View>

            <Text style={[styles.mainTitle, { color: isDark ? '#FFF' : '#1E293B' }]}>
              Trouvez votre <Animated.Text style={{ color: dynamicColor }}>prochain foyer</Animated.Text>
            </Text>

            <Text style={styles.descriptionHeader}>
              Explorez les agences les plus prestigieuses de Goma et leurs catalogues de villas d'exception.
            </Text>
          </View>
          {/* 6. BANNIÈRE AGENCE IMMOBILIÈRE */}
          <AgenceImmoCard
            isDark={isDark}
            name="Goma Immobilier"
            image={immo}
            rating={4.8}
            totalProperties={45}
            location="Goma, RDC"
            specialty="Appartements"
          />

          {/* 7. SECTION PUBLICITÉS */}
          <BoutiqueCard isDark={isDark} data={boutiques} />

          {/* 8. BANNIÈRE PROMO PRINCIPALE - PREMIUM ANIMATED */}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 13 }}
          >
            <TouchableOpacity activeOpacity={0.92}>
              <ImageBackground
                source={partenaires}
                style={styles.promoBanner}
                imageStyle={{ borderRadius: 28 }}
              >
                {/* Premium Gradient */}
                <View style={styles.premiumGradientOverlay} />
                <View style={styles.promoOverlay}>
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={150}
                    transition={{ type: 'timing', duration: 700 }}
                  >
                    <Text style={styles.promoTitle}>Devenez Partenaire</Text>
                  </MotiView>
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    delay={250}
                    transition={{ type: 'timing', duration: 700 }}
                  >
                    <Text style={styles.promoSub}>Publiez vos annonces et touchez des milliers de clients.</Text>
                  </MotiView>
                  <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    delay={350}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <TouchableOpacity
                      style={styles.promoBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push('/(admin)' as any)}
                    >
                      <Animated.Text style={[styles.promoBtnText, { color: dynamicColor }]}>Commencer →</Animated.Text>
                    </TouchableOpacity>
                  </MotiView>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </MotiView>

        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
// Optimized Category Button with animated background color
const MemoizedCategoryButton = React.memo(
  ({ category, isSelected, onPress, dynamicColor, getCategoryIcon }: any) => {
    const animatedValue = React.useRef(new Animated.Value(isSelected ? 1 : 0)).current;

    React.useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: isSelected ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, [isSelected]);

    // Sécurise les couleurs pour Animated : toujours du rgba
    const safeCategoryColor = /^#[0-9A-Fa-f]{6}$/.test(category.color)
      ? toRgba(category.color, 0.2)
      : 'rgba(0,0,0,0.1)';
    const safeDynamicColor = /^#[0-9A-Fa-f]{6}$/.test(dynamicColor)
      ? toRgba(dynamicColor, 1)
      : toRgba('#06B6D4', 1); // fallback bleu si dynamicColor n'est pas hex

    const backgroundColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [safeCategoryColor, safeDynamicColor],
    });

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.categoryIconContainer,
            { backgroundColor },
            isSelected && styles.categoryIconContainerActive,
          ]}
        >
          <MaterialCommunityIcons
            name={getCategoryIcon(category.id) as any}
            size={24}
            color={isSelected ? 'white' : 'black'}
          />
        </Animated.View>
        <Text
          style={[
            styles.categoryLabel,
            isSelected && styles.categoryLabelActive,
          ]}
          numberOfLines={1}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  }
);
MemoizedCategoryButton.displayName = 'MemoizedCategoryButton';
/** * --- STYLES EXTRÊMES (ELITE XD) ---
 */
const styles = StyleSheet.create({
  stickySearch: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 1000,
  },
  skeleton: { backgroundColor: '#222', borderRadius: 8 },
  skeletonBody: { padding: 20 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    height: 62,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  filterTrigger: {
    backgroundColor: '#06B6D4',
    width: 50,
    height: 50,
    borderRadius: 14,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  viewModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 5,
  },
  viewModeLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#06B6D4',
  },
  viewModeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor : "transparent",
    shadowRadius: 3,
  },
  modeBtnActive: {
    backgroundColor: '#06B6D4',
    borderColor: '#06B6D4',
    elevation: 4,
    shadowOpacity: 0.08,
  },

  container: { flex: 1 },
  scrollContent: { paddingBottom: 150 },

  // Sections Générales
  sectionContainer: { marginVertical: 10, marginTop: 74 },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    // marginTop: 74,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 36,
  },
  seeAll: { fontWeight: '800', fontSize: 13 },

  // NOUVELLE SECTION CATÉGORIES - SANS ARRONDIS - PREMIUM
  categorySection: {
    marginVertical: 5,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  categorySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 14,
    alignItems: 'stretch',
  },
  categoryMotiWrapper: {
    width: 165,
    marginHorizontal: 2,
  },
  categoryCardNew: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    minHeight: 200,
    elevation: 3,
  },
  categoryImageBox: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F4F8',
  },
  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 16,
  },
  categoryLabelNew: {
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  categoryActiveBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  checkMark: {
    color: '#06B6D4',
    fontSize: 20,
    fontWeight: '900',
  },

  // Feature Cards (Carousel) - PREMIUM GRADIENT
  featureBg: {
    width: width * 0.85,
    height: 240,
    marginRight: 15,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }
  },
  premiumGradientOverlay: {
    ...StyleSheet.absoluteFillObject,

    borderRadius: 2,
  },
  featureOverlay: {
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.43)',
    borderBottomLeftRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  featureDesc: {
    color: '#E2E8F0',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featureButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 14,
    elevation: 4,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureButtonText: {
    color: '#06B6D4',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Résultats
  resultsSection: { paddingHorizontal: 10, marginTop: 2 },

  resultCount: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Grille de propriétés multi-colonnes
  propertyGridContainer: {
    gap: 0,
  },
  propertyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 20,
    fontSize: 16.5,
    paddingHorizontal: 40,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  resetBtn: {
    marginTop: 28,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  resetText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14.5,
    letterSpacing: 0.4,
  },

  // SECTION PUBLICITÉS - PREMIUM
  adSection: {
    marginVertical: 32,
  },
  adCard: {
    width: 240,
    height: 160,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }
  },
  adPremiumOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 16,
  },
  adOverlay: {
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  adBadge: {
    color: '#FF6B9D',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  adTitle: {
    color: 'white',
    fontSize: 16.5,
    fontWeight: '900',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  adPrice: {
    color: '#FEC563',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },


  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 5,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1.5,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },

  // Banner Promo - PREMIUM ANIMATED
  promoBanner: {
    margin: 24,
    height: 240,
    overflow: 'hidden',
    justifyContent: 'center',
    borderRadius: 28,
    elevation: 6,

    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  promoOverlay: {
    padding: 32,
    backgroundColor: '06B6D4',
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  promoTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  promoSub: {
    color: 'rgba(255, 255, 255, 0.97)',
    marginTop: 10,
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  promoBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#FFF',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  promoBtnText: {
    color: '#06B6D4',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryContent: {
    paddingRight: 16,
    gap: 10,
  },
  categoryCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
    minWidth: 90,
  },
  // categoryCardActive: {
  //   backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.08)',
  // },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  categoryIconContainerActive: {
    borderWidth: 0,
    backgroundColor: 'white'
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  headerWrapper: {
    paddingHorizontal: 25,
    marginTop: 30,
    marginBottom: 10,
  },
  badgePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  badgePromoText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 5,
  },
  mainTitle: {
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -1,
  },
  descriptionHeader: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    fontWeight: '500',
    maxWidth: '90%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 30, // Ajusté selon la plateforme
    marginBottom: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    backgroundColor: '#06B6D4',
    padding: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  // Assurez-vous que sectionTitle ne force pas de marginBottom ici pour rester aligné au logo
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.8
  },

});

