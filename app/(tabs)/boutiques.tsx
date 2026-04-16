import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Animated,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Ionicons, 
  Feather, 
  MaterialCommunityIcons, 
  FontAwesome5 
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import {useAuthContext } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// --- Types ---
interface Boutique {
  id: string;
  name: string;
  description: string;
  image: string;
  territoire?: string;
  ville?: string;
  province?: string;
  category?: string;
  rating?: number;
  isVerified?: boolean;
}

// --- Constantes de Design ---
const CATEGORIES = [
  { id: '1', name: 'Tout', icon: 'grid' },
  { id: '2', name: 'Mode', icon: 'shirt' },
  { id: '3', name: 'Luxe', icon: 'diamond' },
  { id: '4', name: 'Électronique', icon: 'laptop' },
  { id: '5', name: 'Maison', icon: 'home' },
  { id: '6', name: 'Beauté', icon: 'sparkles' },
];

export default function BoutiquesListScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- États ---
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [filteredBoutiques, setFilteredBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {user} = useAuthContext();
  // --- Theme Colors ---
  const theme = {
    bg: isDark ? '#1E293B' : '#F8F9FA',
    card: isDark ? '#171e2a' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#1E293B',
    subtext: isDark ? '#A1A1AA' : '#64748B',
    accent: '#06B6D4',
    border: isDark ? 'transparent' : '#E5E7EB',
    input: isDark ? '#2C2C2E' : '#F1F5F9',
  };

  // --- Fetch Data ---
  const loadBoutiques = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('boutiques')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Ajout de mock data pour le design si les champs manquent
        const enhancedData = data.map(b => ({
          ...b,
          rating: (Math.random() * (5 - 4) + 4).toFixed(1),
          isVerified: true,
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].name
        }));
        setBoutiques(enhancedData);
        setFilteredBoutiques(enhancedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBoutiques();
  }, []);

  // --- Logic Filtrage ---
  useEffect(() => {
    let result = boutiques;
    if (searchQuery) {
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.ville?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeCategory !== 'Tout') {
      result = result.filter(b => b.category === activeCategory);
    }
    setFilteredBoutiques(result);
  }, [searchQuery, activeCategory, boutiques]);

  const handleCategoryPress = (catName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(catName);
  };

  // --- Animations Header ---
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [140, 80],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // --- Render Components ---

  const renderHeader = () => (
    <View style={styles.fixedHeader}>
      <Animated.View style={[styles.headerTop, { opacity: headerOpacity }]}>
        <View>
          <Text style={styles.welcomeText}>Découvrir</Text>
          <Text style={[styles.mainTitle, { color: theme.text }]}>Toutes Les Boutiques</Text>
        </View>
        <TouchableOpacity style={[styles.profileBtn, { borderColor: theme.border }]}>
          <Image 
            source={{ uri: user?.avatar || '' }} 
            style={styles.avatar} 
          />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
          <Feather name="search" size={18} color={theme.subtext} style={{ marginLeft: 12 }} />
          <TextInput
            placeholder="Rechercher une boutique,..."
            placeholderTextColor={theme.subtext}
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.subtext} style={{ marginRight: 12 }} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.accent }]}>
          <Ionicons name="options-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categoriesWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.name;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryPress(cat.name)}
              style={[
                styles.categoryTab,
                { 
                  backgroundColor: isActive ? theme.accent : theme.card,
                  borderColor: isActive ? theme.accent : theme.border
                }
              ]}
            >
              <MaterialCommunityIcons 
                name={cat.icon as any} 
                size={18} 
                color={isActive ? '#FFF' : theme.subtext} 
              />
              <Text style={[
                styles.categoryText, 
                { color: isActive ? '#FFF' : theme.text }
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderBoutiqueItem = ({ item, index }: { item: Boutique; index: number }) => (
    <Animated.View style={styles.cardWrapper}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/boutique/${item.id}`);
        }}
        style={[styles.boutiqueCard, { backgroundColor: theme.card }]}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        
        <View style={styles.cardInfo}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.boutiqueName, { color: theme.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={16} color={theme.accent} style={{ marginLeft: 4 }} />
                )}
              </View>
              <Text style={[styles.boutiqueDesc, { color: theme.subtext }]} numberOfLines={1}>
                {item.description}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <FontAwesome5 name="star" size={10} color="#FFD700" solid />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.locationTag}>
              <Ionicons name="location-sharp" size={12} color={theme.accent} />
              <Text style={[styles.locationText, { color: theme.subtext }]}>
                {item.ville || 'Lubumbashi'}
              </Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: theme.input }]}>
              <Text style={[styles.categoryBadgeText, { color: theme.subtext }]}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.actionCircle}>
          <Feather name="arrow-up-right" size={20} color={theme.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {renderHeader()}
      
      {loading && !isRefreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ marginTop: 12, color: theme.subtext }}>Chargement des boutiques...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredBoutiques}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          ListHeaderComponent={renderCategoryFilter}
          renderItem={renderBoutiqueItem}
          onRefresh={() => {
            setIsRefreshing(true);
            loadBoutiques();
          }}
          refreshing={isRefreshing}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Feather name="info" size={50} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                Aucune boutique ne correspond à votre recherche.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    marginTop : 30,
    paddingBottom: 15,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  profileBtn: {
    padding: 2,
    borderWidth: 1,
    borderRadius: 25,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  filterBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  categoriesWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listPadding: {
    paddingBottom: 100,
  },
  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  boutiqueCard: {
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    // iOS Shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    // Android Shadow
    elevation: 3,
  },
  cardImage: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boutiqueName: {
    fontSize: 17,
    fontWeight: '800',
    maxWidth: '85%',
  },
  boutiqueDesc: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B8860B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
  },
});