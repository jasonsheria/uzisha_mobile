import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions, ActivityIndicator, Platform,
  Animated, StatusBar, Modal, Pressable, FlatList,
  Share, SafeAreaView, LayoutAnimation, UIManager,
  ScrollView, ScrollViewProps
} from 'react-native';
import ImageCarousel from '@/components/ImageCarousel';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';
import {
  MaterialCommunityIcons,
  Ionicons,
  Feather,
  FontAwesome5,
  AntDesign,
  Entypo,
  SimpleLineIcons
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/components/useColorScheme';
import ConciergeChat from '@/components/ConciergeChat';
import ProductCard from '@/components/ProductCard';
import CollectionsBanner from '@/components/CollectionsBanner';
import { DynamicIcon } from '@/components/DynamicIcon';
import { useTheme } from '@/contexts/ThemeContext';
import Colors from '@/constants/Colors';
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import { File, Directory } from 'expo-file-system'; // Nouvel import
const prefix = Linking.createURL('/');

// --- CONFIGURATION ET CONSTANTES ---
const { width, height } = Dimensions.get('window');
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
}
const HEADER_MAX_HEIGHT = height * 0.6;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 120 : 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// --- COMPOSANTS ATOMIQUES ---

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// 1. Modifiez votre SkeletonPulse pour qu'il accepte des styles personnalisés


// ... dans votre composant BoutiqueDetailScreen ...


const Badge = ({ text, icon }: { text: string; icon: string }) => (
  <View style={styles.badgeContainer}>
    <DynamicIcon name={icon as any} size={14} />
    <Text style={styles.badgeText}>{text.toUpperCase()}</Text>
  </View>
);

// --- COMPOSANT PRINCIPAL ---

export default function BoutiqueDetailScreen() {
  const { id } = useLocalSearchParams();
  const { isDark, dynamicColor } = useTheme();

  const router = useRouter();
  const qrRef = useRef<any>(null);

  // --- ÉTATS ---
  const [boutique, setBoutique] = useState<any>(null);
  // Pour le carrousel d'images, on suppose que boutique.images est un tableau d'urls
  const boutiqueImages = boutique?.images && boutique.images.length > 0
    ? boutique.images
    : boutique?.image
      ? [boutique.image]
      : [];
  const [articles, setArticles] = useState<Product[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tout');
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [likedItems, setLikedItems] = useState<string[]>([]);
  const categories = useMemo(() => {
    const staticTabs = ['Tout'];
    // Récupère les types de la boutique (ex: ['Vêtements', 'Sacs']) ou un tableau vide
    const boutiqueTypes = boutique?.type || [];
    const extraTabs = ['Nouveautés', 'Premium', 'Soldes'];

    // On combine tout en supprimant les doublons éventuels
    return [...new Set([...staticTabs, ...boutiqueTypes, ...extraTabs])];
  }, [boutique?.type]);
  // --- ANIMATIONS ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const sharePanelValue = useRef(new Animated.Value(height)).current;
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
  // --- LOGIQUE DE DONNÉES ---
  useEffect(() => {
    fetchData();
  }, [id]);
  // 1. Enregistrer l'image du QR Code (votre fonction actuelle modifiée pour être plus stable)
  const saveQrToGallery = async () => {
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

  const shareToWhatsApp = async () => {
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

  // 3. Copier le lien de la boutique
  const copyStoreLink = async () => {
    // Génère un lien de type : uzisha://boutique/ID_DE_LA_BOUTIQUE
    // Ou en prod : https://uzisha.netlify.com/boutique/ID_DE_LA_BOUTIQUE
    const url = `https://uzisha.netlify.app/boutique/${boutique.id}`;

    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Lien copié", "Le lien Uzisha a été copié.");
  };
  const fetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setUser(userData || session.user);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: b } = await supabase.from('boutiques').select('*').eq('id', id).single();
      if (b) {
        setBoutique(b);
        const { data: a } = await supabase.from('properties').select('*').eq('boutique_id', b.id);
        const products = a || [];
        setArticles(products);
        setFilteredArticles(products);
      }
    } catch (e) {
      console.error(e);
    } finally {
      // setTimeout(() => setLoading(false), 1200);
      setLoading(false);
    }
  };

  // --- FILTRAGE ---
  const filterByCategory = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveTab(category);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (category === 'Tout') {
      setFilteredArticles(articles);
    } else {
      setFilteredArticles(articles.filter(item => item.category === category || item.title.includes(category)));
    }
  };

  // --- INTERPOLATIONS ---
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-height, 0],
    outputRange: [3, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  const navOpacity = scrollY.interpolate({
    inputRange: [HEADER_SCROLL_DISTANCE - 40, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // --- ACTIONS ---
  const toggleLike = (productId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLikedItems(prev =>
      prev.includes(productId) ? prev.filter(i => i !== productId) : [...prev, productId]
    );
  };

  const openSharePanel = () => {
    setIsShareModalVisible(true);
    Animated.spring(sharePanelValue, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  };

  const closeSharePanel = () => {
    Animated.timing(sharePanelValue, {
      toValue: height,
      duration: 300,
      useNativeDriver: true
    }).start(() => setIsShareModalVisible(false));
  };

  const shareQrCode = async () => {
    if (qrRef.current) {
      qrRef.current.toDataURL(async (dataURL: string) => {
        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        const fileUri = FileSystem.documentDirectory + `qr-${id}.png`;
        await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: "base64" });
        await Sharing.shareAsync(fileUri);
      });
    }
  };

  // --- RENDU DES ARTICLES ---
  const renderProduct = useCallback(({ item, index }: { item: Product, index: number }) => {
    // Détection badge visuel
    let badge = null;
    if (item.category?.toLowerCase().includes('premium')) badge = { text: 'Premium', color: '#FFD700', icon: 'star' };
    else if (item.category?.toLowerCase().includes('soldes')) badge = { text: 'Promo', color: '#FF2D55', icon: 'tag' };
    else if (index < 3) badge = { text: 'Nouveau', color: '#00C48C', icon: 'zap' };

    return (
      <ProductCard
        item={item}
        index={index}
        liked={likedItems.includes(item.id)}
        onPress={() => router.push(`/property/${item.id}`)}
        onLike={() => toggleLike(item.id)}
        dynamicColor={dynamicColor}
        badge={badge}
      />
    );
  }, [likedItems, dynamicColor]);
  

  // --- ECRAN DE CHARGEMENT ---
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
    <View style={[styles.container, { backgroundColor: isDark ? Colors.black : Colors.white }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER PARALLAXE IMMERSIF avec carrousel d'images */}
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
        <View style={{ flex: 1 }}>
          <ImageCarousel images={boutiqueImages} />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', isDark ? '#000' : '#FFF']}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {/* TEXTE HERO */}
        <Animated.View style={[styles.heroTextContainer, { opacity: imageOpacity }]}>
          <Badge text="Vendeur Certifié" icon="shield-check" />
          <Text style={styles.mainTitle}>{boutique?.name}</Text>
          <View style={styles.locationRow}>
            <DynamicIcon name="location-exit" size={16} />
            <Text style={styles.locationLabel}>{boutique?.province || 'Lubumbashi'}, {boutique?.ville || boutique?.territoire}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* NAVBAR FIXE AU SCROLL */}
      <AnimatedBlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.navbar, { opacity: navOpacity, marginTop: 10 }]}
      >
        <SafeAreaView style={styles.navbarContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navIconBtn}>
            <Ionicons name="chevron-back" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: isDark ? '#FFF' : '#000' }]}>{boutique?.name}</Text>
          <TouchableOpacity onPress={openSharePanel} style={styles.navIconBtn}>
            <Feather name="share" size={22} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
        </SafeAreaView>
      </AnimatedBlurView>

      {/* BOUTONS FLOTTANTS INITIALS */}
      {!loading && (
        <View style={styles.fixedTopActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.roundBtn}>
            <BlurView intensity={60} tint="dark" style={styles.roundBtnBlur}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity onPress={openSharePanel} style={styles.roundBtn}>
            <BlurView intensity={60} tint="dark" style={styles.roundBtnBlur}>
              <Feather name="share" size={20} color="#FFF" />
            </BlurView>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTE PRINCIPALE */}
      <Animated.FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={styles.scrollBody}
        columnWrapperStyle={styles.rowWrapper}
        ListHeaderComponent={() => (
          <View style={styles.headerSpacer}>
            {/* GRILLE D'ACTIONS */}
            <View style={styles.mainActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setIsConciergeOpen(true)}>
                <Animated.View style={[styles.btnGradient, { backgroundColor: dynamicColor || Colors.accent }]}>
                  <MaterialCommunityIcons name="chat-processing" size={22} />
                  <Text style={styles.btnText}>DISCUTER</Text>
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSecondary, { borderColor: isDark ? '#333' : '#EEE' }]}
                onPress={() => Linking.openURL(`tel:${boutique?.phone}`)}
              >
                <SimpleLineIcons name="phone" size={18} color={isDark ? '#FFF' : '#000'} />
              </TouchableOpacity>
            </View>

            {/* SECTION ABOUT */}
            <View style={styles.aboutSection}>
              <Animated.Text style={[styles.sectionLabel, { color: dynamicColor || Colors.accent }]}>NOTRE HISTOIRE</Animated.Text>
              <Text style={[styles.aboutText, { color: isDark ? '#CCC' : '#444' }]}>
                {boutique?.description || "Incarner l'élégance à travers des collections intemporelles et un service de conciergerie sur mesure pour nos membres privilégiés."}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: isDark ? '#FFF' : '#000' }]}>{articles.length}</Text>
                  <Text style={styles.statTitle}>ARTICLES</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: isDark ? '#FFF' : '#000' }]}>4.9</Text>
                  <Text style={styles.statTitle}>NOTE</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: isDark ? '#FFF' : '#000' }]}>1.2k</Text>
                  <Text style={styles.statTitle}>SUIVIS</Text>
                </View>
              </View>
            </View>

            {/* SECTION AVIS CLIENTS */}
            <View style={styles.reviewsSection}>
              <Animated.Text style={[styles.sectionLabel, { color: dynamicColor || Colors.accent, marginBottom: 10 }]}>AVIS CLIENTS</Animated.Text>
              <View style={styles.reviewsRow}>
                {/* Avis fictifs */}
                <View style={styles.reviewCard}>
                  <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.reviewAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>Jean M.</Text>
                    <Text style={styles.reviewText}>Superbe boutique, produits de qualité et service rapide !</Text>
                  </View>
                  <View style={styles.reviewStars}><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /></View>
                </View>
                <View style={styles.reviewCard}>
                  <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} style={styles.reviewAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>Fatou K.</Text>
                    <Text style={styles.reviewText}>J’adore la sélection premium, je recommande vivement !</Text>
                  </View>
                  <View style={styles.reviewStars}><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /><AntDesign name="star" size={14} color="#FFD700" /></View>
                </View>
              </View>
            </View>
            {/* BANNIÈRE COLLECTIONS EN VEDETTE */}
            <CollectionsBanner />
 

            {/* FILTRES CATÉGORIES */}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => filterByCategory(cat)}
                    style={[
                      styles.filterTab,
                      // Style actif dynamique
                      activeTab === cat && {
                        backgroundColor: isDark ? '#2120209b' : '#EEE',
                        borderColor: isDark ? '#2120209b' : '#EEE'
                      }
                    ]}
                  >
                    <Animated.Text style={[
                      styles.filterTabText,
                      {
                        color: activeTab === cat && dynamicColor ? dynamicColor : isDark ? '#FFF' : '#000'
                      }
                    ]}>
                      {cat}
                    </Animated.Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
        renderItem={renderProduct}

        ListFooterComponent={() => (
          <View style={styles.footer}>
            <Image
              source={{ uri: boutique?.image }}
              style={styles.footerLogo}
              blurRadius={10}
            />
            <Text style={styles.footerText}>MEMBRE EXCLUSIF DE LA COLLECTION LUXE</Text>
            <View style={styles.legalRow}>
              <Text style={styles.legalText}>Politique de retour</Text>
              <View style={styles.dot} />
              <Text style={styles.legalText}>Authenticité Garantie</Text>
            </View>
          </View>
        )}
      />

      {/* PANNEAU DE PARTAGE MODAL (DESIGN CUSTOM) */}
      <Modal visible={isShareModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeSharePanel}>
          <Animated.View style={[
            styles.sharePanel,
            { backgroundColor: isDark ? '#1A1A1A' : '#FFF', transform: [{ translateY: sharePanelValue }] }
          ]}>
            <View style={styles.dragHandle} />
            <Text style={[styles.shareTitle, { color: isDark ? '#FFF' : '#000' }]}>Partager ma page</Text>

            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  key={isShareModalVisible ? 'visible' : 'hidden'}
                  value={`https://uzisha.netlify.app/boutique/${boutique.id}`}
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
              </View>
              <Text style={styles.qrHint}>Scannez pour ouvrir la boutique</Text>
            </View>

            <View style={styles.shareActions}>
              {/* OPTION ENREGISTRER */}
              <TouchableOpacity style={styles.shareOption} onPress={saveQrToGallery}>
                <View style={[styles.iconCircle, { backgroundColor: Colors.accent }]}>
                  <Feather name="download" size={20} color="#FFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: isDark ? '#FFF' : '#000' }]}>Enregistrer</Text>
              </TouchableOpacity>

              {/* OPTION WHATSAPP */}
              <TouchableOpacity style={styles.shareOption} onPress={shareToWhatsApp}>
                <View style={[styles.iconCircle, { backgroundColor: '#25D366' }]}>
                  <FontAwesome5 name="whatsapp" size={20} color="#FFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: isDark ? '#FFF' : '#000' }]}>WhatsApp</Text>
              </TouchableOpacity>

              {/* OPTION COPIER */}
              <TouchableOpacity style={styles.shareOption} onPress={copyStoreLink}>
                <View style={[styles.iconCircle, { backgroundColor: '#007AFF' }]}>
                  <Ionicons name="link" size={20} color="#FFF" />
                </View>
                <Text style={[styles.shareOptionText, { color: isDark ? '#FFF' : '#000' }]}>Copier</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* FAB CONCIERGE */}
      <Animated.View style={[styles.fab, {
        transform: [{ scale: scrollY.interpolate({ inputRange: [0, 300], outputRange: [0, 1], extrapolate: 'clamp' }) }]
      }]}>
        <TouchableOpacity onPress={() => {
          // verifier si l'utilisateur est connecté
          if (!user) {
            // Ajouter le bouton de connexion de connexion dans l'alert
            Alert.alert(
              "Connexion requise",
              "Veuillez vous connecter pour discuter avec le concierge.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Se connecter", onPress: () => router.push('/login') }
              ]
            );

            return;
          }
          setIsConciergeOpen(true)

        }}>
          <Animated.View style={[styles.fabGradient, { backgroundColor: dynamicColor || Colors.accent }]}>
            <MaterialCommunityIcons name="chat-outline" size={28} color={'white'} />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={isConciergeOpen} animationType="slide" presentationStyle="pageSheet" transparent={true}>
        <ConciergeChat otherUserId={user?.id || ''} boutique={boutique} onClose={() => setIsConciergeOpen(false)} />
      </Modal>
    </View>
  );
}

// --- STYLES EXTRÊMES ---

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeleton: { backgroundColor: '#222', borderRadius: 8 },
  skeletonBody: { padding: 20 },

  // Header & Parallax
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: HEADER_MAX_HEIGHT,
    overflow: 'hidden',
  },
  headerBg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
  },
  mainTitle: {
    fontSize: 62,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 65,
    letterSpacing: -2,
    marginTop: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 1,
  },

  // Navbar
  navbar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: HEADER_MIN_HEIGHT,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  navbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedTopActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20, right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 99,
  },
  roundBtn: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
  },
  roundBtnBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll Content
  scrollBody: {
    paddingTop: HEADER_MAX_HEIGHT - 30,
    paddingBottom: 100,
  },
  headerSpacer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  btnPrimary: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: Colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  btnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  btnSecondary: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats & About
  aboutSection: {
    marginBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'justify',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 35,
    backgroundColor: 'rgba(128,128,128,0.05)',
    borderRadius: 25,
    paddingVertical: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
  },
  statTitle: {
    fontSize: 9,
    color: '#888',
    fontWeight: '700',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '50%',
    backgroundColor: 'rgba(128,128,128,0.2)',
    alignSelf: 'center',
  },

  // Filters
  filterContainer: {
    marginBottom: 25,
    marginHorizontal: -20,
  },
  filterTab: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    marginRight: 10,
  },
  filterTabText: {
    fontWeight: '700',
    fontSize: 13,
  },

  // Product Grid
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  productCard: {
    width: (width - 55) / 2,
    marginBottom: 20,
  },
  cardWrapper: {
    height: 280,
    borderRadius: 24,
    backgroundColor: '#111',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 15, right: 15,
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 20, left: 15, right: 15,
  },
  cardPrice: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.8,
  },
  // Footer
  footer: {
    alignItems: 'center',
    padding: 60,
    marginTop: 40,
  },
  footerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#888',
    letterSpacing: 2,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  legalText: {
    fontSize: 11,
    color: '#666',
  },
  dot: {
    width: 3, height: 3,
    borderRadius: 1.5,
    backgroundColor: '#444',
    marginHorizontal: 10,
  },

  // Share Panel
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sharePanel: {
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    paddingBottom: 50,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(128,128,128,0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 25,
  },
  shareTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  qrWrapper: {
    padding: 15,             // Espace supplémentaire entre le QR et le bord du cadre
    backgroundColor: '#FFF',
    borderRadius: 30,        // Plus arrondi pour un look moderne
    // Ombre plus douce et diffuse
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  qrHint: {
    marginTop: 15,
    color: '#888',
    fontWeight: '600',
    fontSize: 12,
  },
  shareActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 25,
    elevation: 10,
    zIndex: 999,
  },
  fabGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  productBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  productBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 11,
    marginLeft: 5,
    letterSpacing: 1,
  },
   reviewsSection: {
    marginBottom: 30,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  reviewsRow: {
    flexDirection: 'column',
    gap: 12,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(128,128,128,0.07)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  reviewName: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
  },
  reviewText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  reviewStars: {
    flexDirection: 'row',
    marginLeft: 8,
    marginTop: 2,
  }

});