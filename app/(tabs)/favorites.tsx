import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { PropertyCard } from '@/components/PropertyCard';
import { Property } from '@/types';
import { useColorScheme } from '@/components/useColorScheme';

const FAVORITE_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Magnifique Villa avec vue sur la mer',
    type: 'house',
    listingType: 'sale',
    price: 450000,
    location: 'Dakar, Sénégal',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500',
    reviews: 234,
  },
];

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      {/* Header Fixe */}
      <Header title="Mes Favoris" subtitle={`${FAVORITE_PROPERTIES.length} bien(s) sauvegardé(s)`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {FAVORITE_PROPERTIES.length > 0 ? (
            FAVORITE_PROPERTIES.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>❤️</Text>
              <Text style={styles.emptyTitle}>Aucun favori</Text>
              <Text style={styles.emptyText}>
                Ajoutez des propriétés à vos favoris pour les retrouver ici
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : Colors.white,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 80,
      paddingHorizontal: 32,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : Colors.black,
      marginBottom: 8,
    },
    emptyText: {
      color: Colors.gray500,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
