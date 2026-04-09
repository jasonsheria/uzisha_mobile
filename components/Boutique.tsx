import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ImageBackground,
  Dimensions,
  Animated,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { DynamicIcon } from '@/components/DynamicIcon';

// --- CONFIGURATION ---
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;
const SPACING = 16;
const ITEM_FULL_WIDTH = CARD_WIDTH + SPACING;
const AUTO_SCROLL_SPEED = 3500; // Temps entre chaque transition (ms)

// --- TYPES ---
export interface BoutiqueData {
  id: string;
  name: string;
  description: string;
  userId: string;
  adresse: string;
  phone: string;
  image: string;
  logo: string;
  type: string[];
  localization: string | { lat?: string; lng?: string }; // Modifié pour accepter les deux

  //information physique
  province: string;
  Territoire: string;
  Ville: string;
  commune: string
}

// --- FAKE DATA ---
const FAKE_BOUTIQUES: BoutiqueData[] = [
];

interface Props {
  data?: BoutiqueData[];
  onPressStore?: (id: string) => void;
  isDark: boolean;
}

const BoutiqueCard = ({ data, onPressStore, isDark }: Props) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const { dynamicColor } = useTheme();
  // 1. On détermine la base (vraies données ou fake)
  const baseData = data && data.length > 0 ? data : FAKE_BOUTIQUES;

  // 2. On utilise useMemo au lieu de useState pour réagir aux changements de data
  const infiniteData = React.useMemo(() => {
    return [...baseData, ...baseData, ...baseData];
  }, [baseData]);

  // 3. On initialise l'index au milieu de la liste infinie
  const [currentIndex, setCurrentIndex] = useState(baseData.length);
  // --- LOGIQUE AUTO-SCROLL ---
  useEffect(() => {
    if (data && data.length > 0) {
      // Force le scroll au milieu quand les vraies données arrivent
      flatListRef.current?.scrollToIndex({
        index: data.length,
        animated: false,
      });
      setCurrentIndex(data.length);
    }
  }, [data]);
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex + 1;

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * ITEM_FULL_WIDTH,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, AUTO_SCROLL_SPEED);
    return () => clearInterval(timer);
  }, [currentIndex]);
  // Gestion de la boucle infinie (téléportation invisible)
  const handleScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / ITEM_FULL_WIDTH);

    // Si on dépasse le bloc du milieu, on revient au centre
    if (index >= baseData.length * 2) {
      const resetIndex = index - baseData.length;
      flatListRef.current?.scrollToOffset({
        offset: resetIndex * ITEM_FULL_WIDTH,
        animated: false,
      });
      setCurrentIndex(resetIndex);
    } else if (index < baseData.length) {
      const resetIndex = index + baseData.length;
      flatListRef.current?.scrollToOffset({
        offset: resetIndex * ITEM_FULL_WIDTH,
        animated: false,
      });
      setCurrentIndex(resetIndex);
    } else {
      setCurrentIndex(index);
    }
  };

  const renderItem = ({ item, index }: { item: BoutiqueData; index: number }) => {
    const getLocalizationText = () => {
      if (!item.localization) return "RDC";

      // Si c'est l'objet JSON {lat, lng}
      if (typeof item.localization === 'object') {
        return item.localization.lat ? `GPS: ${item.localization.lat}` : item.province + ',' + item.Ville;
      }

      // Si c'est une string simple (Fake Data)
      return item.localization;
    };
    const locationDisplay = getLocalizationText().toUpperCase();
    const inputRange = [
      (index - 1) * ITEM_FULL_WIDTH,
      index * ITEM_FULL_WIDTH,
      (index + 1) * ITEM_FULL_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['10deg', '0deg', '-10deg'],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => router.push(`/boutique/${item.id}`)}
      >
        <Animated.View style={[
          styles.cardContainer,
          {
            transform: [{ scale }, { perspective: 1000 }, { rotateY }],
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          }
        ]}>
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.cardImage}
            imageStyle={{ borderRadius: 30 }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
              style={styles.gradient}
            />

            <View style={styles.cardHeader}>
              <BlurView intensity={Platform.OS === 'ios' ? 25 : 80} tint="dark" style={styles.locationBadge}>
                <DynamicIcon name="shield-check" size={14} />
                <Text style={styles.locationText}>{locationDisplay}</Text>
              </BlurView>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text numberOfLines={2} style={styles.descriptionText}>
                {item.description}
              </Text>

              <View style={styles.typeRow}>
                {/* .slice(0, 3) pour n'afficher que les 3 premiers tags */}
                {item.type?.slice(0, 3).map((tag, i) => (
                  <View key={i} style={[styles.tag, { borderColor: isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(0,0,0,0.1)' }]}>
                    <Animated.View style={[styles.dot, { backgroundColor: dynamicColor }]} />
                    <Text style={[styles.tagText, { color: isDark ? "white" : "#bdc2ca" }]} numberOfLines={1}>
                      {tag.length > 8 ? tag.substring(0, 7) + '.' : tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ImageBackground>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Animated.Text style={[styles.sectionTitle, { color: dynamicColor}]}>
            Boutiques Virtuelles
          </Animated.Text>
          <Text style={styles.subtitle}>Découvrez les pépites de votre région</Text>
        </View>
        <TouchableOpacity style={styles.btnIcon}>
          <DynamicIcon name="lightning-bolt" size={20}  />
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={infiniteData}
        horizontal
        initialScrollIndex={baseData.length}
        getItemLayout={(_, index) => ({
          length: ITEM_FULL_WIDTH,
          offset: ITEM_FULL_WIDTH * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 10 }}
        snapToInterval={ITEM_FULL_WIDTH}
        decelerationRate="fast"
        keyExtractor={(_, index) => index.toString()}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  btnIcon: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 350,
    marginHorizontal: SPACING / 2,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
    }),
  },
  cardImage: {
    flex: 1,
    padding: 22,
    justifyContent: 'space-between',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  cardHeader: {
    alignItems: 'flex-start',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  locationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 6,
    letterSpacing: 1,
  },
  cardFooter: {
    gap: 6,
  },
  storeName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

export default BoutiqueCard;