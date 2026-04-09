import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  ImageSourcePropType
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme} from '@/contexts/ThemeContext';
import { DynamicIcon } from './DynamicIcon';

const { width } = Dimensions.get('window');

interface AgenceProps {
  name: string;
  image: ImageSourcePropType;
  rating: number;
  totalProperties: number;
  location: string;
  specialty: string;
  isVerified?: boolean;
  onPress?: () => void;
  isDark: boolean;
}

const AgenceImmoCard = ({
  name = "Elite Kivu Luxury",
  image,
  rating = 4.9,
  totalProperties = 124,
  location = "Goma, Nord-Kivu",
  specialty = "Villas de Prestige",
  isVerified = true,
  onPress,
  isDark
}: AgenceProps) => {

    const { dynamicColor } = useTheme();


  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={styles.card}
    >
      {/* IMAGE DE FOND CINÉMATIQUE */}
      <Image source={image} style={styles.bgImage} />
      
      {/* OVERLAY DEGRADÉ TRIPLE COUCHE */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
        style={styles.overlay}
      />

      {/* BADGES SUPÉRIEURS HAUTE PRÉCISION */}
      <View style={styles.topContainer}>
        {isVerified && (
          <BlurView intensity={20} tint="light" style={styles.verifiedBadge}>
            <DynamicIcon name="shield-check" size={14} />
            <Text style={styles.verifiedText}>AGENCE CERTIFIÉE</Text>
          </BlurView>
        )}
        <BlurView intensity={20} tint="dark" style={styles.scoreBadge}>
          <DynamicIcon name="star" size={14} />
          <Text style={styles.scoreText}>{rating}</Text>
        </BlurView>
      </View>

      {/* CONTENU PRINCIPAL */}
      <View style={styles.bottomContainer}>
        <View style={styles.infoSection}>
          <Animated.Text style={[styles.specialtyText, { color: dynamicColor }]}>{specialty.toUpperCase()}</Animated.Text>
          <Text style={styles.agencyName}>{name}</Text>
          <View style={styles.locationBox}>
            <DynamicIcon name="map-marker-radius" size={16} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>

        {/* STATS FLOATING BAR (GLASSMORPHISM) */}
        <BlurView 
          intensity={Platform.OS === 'ios' ? 40 : 90} 
          tint="dark" 
          style={styles.statsBar}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalProperties}</Text>
            <Text style={styles.statLabel}>PROPRIÉTÉS</Text>
          </View>
          
          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <DynamicIcon name="medal-outline" size={18} />
            <Text style={styles.statLabel}>TOP AGENT</Text>
          </View>

          <TouchableOpacity style={styles.exploreBtn}>
            <Animated.View
              
              style={[  styles.exploreGradient, { backgroundColor: dynamicColor }]}
            >
              <MaterialCommunityIcons name="arrow-right" size={20}  color={'white'}/>
            </Animated.View>
          </TouchableOpacity>
        </BlurView>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.94,
    height: 420,
    alignSelf: 'center',
    borderRadius: 35,
    marginVertical: 15,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 25 },
      android: { elevation: 15 },
    }),
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 25,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.4)',
    overflow: 'hidden',
  },
  verifiedText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginLeft: 6,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 25,
  },
  infoSection: {
    marginBottom: 20,
  },
  specialtyText: {
   
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  agencyName: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  exploreBtn: {
    width: 50,
    height: 50,
    borderRadius: 18,
    overflow: 'hidden',
  },
  exploreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AgenceImmoCard;