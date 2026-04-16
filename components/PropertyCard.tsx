import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Image,
  Dimensions,
  Share,
  Platform,
  Modal,
  FlatList,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Property } from '@/types';
import { useColorScheme } from '@/components/useColorScheme';

// --- CONFIGURATION ---
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_GAP = 4;
const CARD_MARGIN = 6;
const GRID_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
import { useTheme } from '@/contexts/ThemeContext';
interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  style?: any;
}

// ==========================================
// 1. VISIONNEUSE D'IMAGES (MODAL)
// ==========================================
const ImageLightbox = ({ visible, images, initialIndex, onClose }: any) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.lightboxContainer}>
        <SafeAreaView style={styles.lightboxHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.lightboxCounter}>{activeIndex + 1} / {images.length}</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        <FlatList
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActiveIndex(index);
          }}
          renderItem={({ item }) => (
            <View style={styles.fullImageWrapper}>
              <Image source={{ uri: item }} style={styles.fullImage} resizeMode="contain" />
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
    </Modal>
  );
};

// ==========================================
// 2. GRILLE PHOTO STYLE FACEBOOK
// ==========================================
const FacebookPhotoGrid = ({ images, onImagePress }: { images: string[], onImagePress: (idx: number) => void }) => {
  let list = images || []; 
  let count = list.length; // Ici, 'count' ne sera plus 'never'
  list = useMemo(() => (Array.isArray(images) ? images : []).filter(img => !!img), [images]);
  count = list.length;
  if (count === 0) return null;

  const renderPhoto = (index: number, widthVal: number, heightVal: number, showOverlay = false) => (
    <TouchableOpacity
      key={index}
      activeOpacity={0.9}
      onPress={() => onImagePress(index)}
      style={[styles.photoBox, { width: widthVal, height: heightVal }]}
    >
      <Image source={{ uri: list[index] }} style={styles.imgFill} />
      {showOverlay && count > 3 && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>+{count - 3}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.gridRow}>
      {count === 1 && renderPhoto(0, GRID_WIDTH, 170)}
      {count === 2 && (
        <View style={styles.flexRow}>
          {renderPhoto(0, (GRID_WIDTH - PHOTO_GAP) / 2, 100)}
          <View style={{ width: PHOTO_GAP }} />
          {renderPhoto(1, (GRID_WIDTH - PHOTO_GAP) / 2, 100)}
        </View>
      )}
      {count >= 3 && (
        <View style={styles.flexRow}>
          {renderPhoto(0, GRID_WIDTH * 0.65, 300)}
          <View style={{ width: PHOTO_GAP }} />
          <View style={{ width: GRID_WIDTH * 0.35 - PHOTO_GAP }}>
            {renderPhoto(1, GRID_WIDTH * 0.35 - PHOTO_GAP, (300 - PHOTO_GAP) / 2)}
            <View style={{ height: PHOTO_GAP }} />
            {renderPhoto(2, GRID_WIDTH * 0.35 - PHOTO_GAP, (300 - PHOTO_GAP) / 2, count > 3)}
          </View>
        </View>
      )}
    </View>
  );
};

// ==========================================
// 3. COMPOSANT PRINCIPAL : PROPERTY CARD
// ==========================================
export const PropertyCard = ({ property, onPress, style }: PropertyCardProps) => {
  const router = useRouter();
  const {isDark, dynamicColor } = useTheme();
  const [liked, setLiked] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const swipeX = useRef(new Animated.Value(0)).current;

  // Données de secours
// Remplace ton bloc finalImages par celui-ci :
const finalImages = useMemo<string[]>(() => {
  // On crée une variable locale castée pour rassurer TypeScript
  const rawImages = property.images as any;

  if (Array.isArray(rawImages) && rawImages.length > 0) {
    return rawImages;
  }
  
  if (typeof rawImages === 'string' && rawImages.length > 0) {
    return [rawImages];
  }

  return []; 
}, [property.images]);
  // PanResponder pour le contact
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => {
        // Ne s'active que si le mouvement horizontal est plus important que le vertical
        return Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 10;
      },
      onPanResponderMove: (_, g) => {
        // Bloquer le mouvement vers la gauche et limiter à 120px
        if (g.dx > 0 && g.dx < 120) {
          swipeX.setValue(g.dx);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80 && property.agent) {
          // Utilise push avec précaution
          router.push({ 
            pathname: '/messaging/[agentId]', 
            params: { agentId: property.agent.id } 
          });
        }
        // Retour à la position 0 avec un effet de ressort
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, bounciness: 10 }).start();
      },
      // IMPORTANT : Si le geste est annulé par le système
      onPanResponderTerminate: () => {
        Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handleShare = async () => {
    try {
      const url = `https://uzisha.netlify.app/property/${property?.id}`
      await Share.share({ message: `Regarde ça : ${property.title}`, url: finalImages[0] });
    } catch (e) { console.log(e); }
  };

  const isRealEstate = property.type === 'house' || property.type === 'apartment';
  // Correction : parser details si c'est une string JSON
  let detailsObj: Record<string, any> = {};
  if (property.details) {
    if (typeof property.details === 'string') {
      try {
        detailsObj = JSON.parse(property.details);
      } catch {
        detailsObj = {};
      }
    } else {
      detailsObj = property.details;
    }
  }

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.timing(scaleAnim, { toValue: 0.98, duration: 100, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start()}
        style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor: isDark ? '#334155' : '#F1F5F9' }]}
      >
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <View style={styles.agentBox}>
            <Image source={{ uri: property.agent?.avatar || 'https://via.placeholder.com/100' }} style={styles.avatar} />
            <View>
              <Text style={[styles.agentName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{property.agent?.name || "Particulier"}</Text>
              <Text style={styles.pubDate}>Publié récemment</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleShare}>
            <MaterialCommunityIcons name="share-outline" size={22} />
          </TouchableOpacity>
        </View>

        {/* INFOS TEXTE */}
        <View style={styles.textPadding}>
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#1E293B' }]} numberOfLines={1}>{property.title}</Text>
          <View style={styles.locRow}>
            <MaterialCommunityIcons name="location-enter" size={14} color={'#06B6D4'} />
            <Text style={styles.locText}>{property.location}</Text>
          </View>
        </View>

        {/* GRILLE PHOTOS */}
        <FacebookPhotoGrid 
          images={finalImages} 
          onImagePress={(idx: number) => { setSelectedImg(idx); setShowLightbox(true); }} 
        />

        {/* SPECS ET PRIX */}
        <View style={styles.infoRow}>
          {isRealEstate ? (
            <View style={styles.specs}>
              <View style={styles.specItem}><MaterialCommunityIcons name="bed-double-outline" size={14}  /><Text style={styles.specVal}>{property.beds || 0}</Text></View>
              <View style={styles.specItem}><MaterialCommunityIcons name="bathtub" size={14}  /><Text style={styles.specVal}>{property.baths || 0}</Text></View>
            </View>
          ) : (
            <View style={styles.specs}>
              {detailsObj && Object.keys(detailsObj).length > 0 ? (
                Object.entries(detailsObj).map(([key, value]) => (
                  <View key={key} style={styles.specItem}>
                    <Text style={[styles.specVal, { marginRight: 2 }]}>{key}:</Text>
                    <Text style={styles.specVal} numberOfLines={1} ellipsizeMode="tail">
                      {String(value).length > 18 ? String(value).slice(0, 15) + '...' : String(value)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.specVal}>Aucun détail</Text>
              )}
            </View>
          )}
          <Animated.Text style={[styles.price, { color: isDark ? '#F1F5F9' : '#06B6D4' }]}>${property.price?.toLocaleString()}</Animated.Text>
        </View>

        {/* FOOTER ACTIONS */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.likeBtn}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? "#EF4444" : "#64748B"} />
          </TouchableOpacity>

          <View style={[styles.swipeTrack, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
            <Animated.Text style={[styles.swipeHint, {color : isDark ? '#F1F5F9' : '#0F172A'}]}>Contact</Animated.Text>
            <Animated.View {...panResponder.panHandlers} style={[styles.swipeHandle, { transform: [{ translateX: swipeX }], backgroundColor: '#06B6D4' }]}> 
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
            </Animated.View>
          </View>
        </View>
      </Pressable> 

      <ImageLightbox visible={showLightbox} images={finalImages} initialIndex={selectedImg} onClose={() => setShowLightbox(false)} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: { paddingHorizontal: CARD_MARGIN, marginBottom: 20 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  agentBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  agentName: { fontSize: 14, fontWeight: '700' },
  pubDate: { fontSize: 11, color: '#94A3B8' },
  textPadding: { paddingHorizontal: 14, paddingBottom: 10 },
  title: { fontSize: 17, fontWeight: '800' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locText: { fontSize: 12, color: '#64748B' },
  gridRow: { flexDirection: 'row' },
  photoBox: { backgroundColor: '#CBD5E1', overflow: 'hidden' },
  imgFill: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  specs: { flexDirection: 'row', gap: 15 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specVal: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  price: { fontSize: 18, fontWeight: '900'},
  footer: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  likeBtn: { padding: 5 },
  swipeTrack: { flex: 1, height: 44, borderRadius: 22, justifyContent: 'center', padding: 4, position: 'relative' },
  swipeHandle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  swipeHint: { position: 'absolute', alignSelf: 'center', fontSize: 12, fontWeight: '700', color: '#06B6D4', textTransform: 'uppercase' },
  flexRow: { flexDirection: 'row' },
  // Lightbox
  lightboxContainer: { flex: 1, backgroundColor: '#000' },
  lightboxHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  lightboxCounter: { color: '#FFF', fontWeight: 'bold' },
  closeButton: { padding: 5 },
  fullImageWrapper: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.8, justifyContent: 'center' },
  fullImage: { width: '100%', height: '100%' }
});