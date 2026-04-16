import React, { useRef } from 'react';
import { Animated, TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DynamicIcon } from '@/components/DynamicIcon';

interface ProductCardProps {
  item: any;
  index: number;
  liked: boolean;
  onPress: () => void;
  onLike: () => void;
  dynamicColor: string;
  badge?: { text: string; color: string; icon: string } | null;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, index, liked, onPress, onLike, dynamicColor, badge }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={[
        styles.productCard,
        {
          opacity: 1,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        style={styles.cardWrapper}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardOverlay}
        />
        {/* Badge visuel */}
        {badge && (
          <View style={[styles.productBadge, { backgroundColor: badge.color }]}> 
            <DynamicIcon name={badge.icon} size={12} color="#FFF" />
            <Text style={styles.productBadgeText}>{badge.text}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={onLike}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? "#FF2D55" : "#FFF"}
          />
        </TouchableOpacity>
        <View style={styles.cardInfo}>
          <Animated.Text style={[styles.cardPrice, { color: dynamicColor }]}>{item.price.toLocaleString()} $</Animated.Text>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    width: 160, // ajustez selon votre grille
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
    color: '#FF2D55',
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
});

export default ProductCard;
