import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { Header } from '@/components/Header';
import Colors from '@/constants/Colors';
import { PropertyCategories } from '@/constants/PropertyCategories';
import { Property, PropertyType } from '@/types';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/utils/supabase';
import { Users } from '@/contexts/AdminContext';
import { router } from 'expo-router';



export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);
  const [Allproperty, setAllProperty] = useState<Property[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PropertyType | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3>(1);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'rating'>('recent');
  const [users, setUsers] = useState<Users[]>([]);
  const [loding, setLoading] = useState(true);
  // Advanced Filters
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [minArea, setMinArea] = useState(0);
  const [rating, setRating] = useState(0);

  const filteredProperties = Allproperty.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || property.type === selectedCategory;
    const matchesPrice = property.price >= priceRange.min && property.price <= priceRange.max;
    const matchesBeds = bedrooms === 0 || (property.beds && property.beds >= bedrooms);
    const matchesArea = (property.area || 0) >= minArea;
    // const matchesRating = property.rating >= rating;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesBeds && matchesArea;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      // case 'rating':
      //   return b.rating - a.rating;
      default:
        return 0;
    }
  });
 useEffect(() => {
     // Simule le chargement des données (remplacez par votre logique réelle)
     loadArticles();
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
       }));
 
       // CRUCIAL : On met à jour 'properties' car c'est elle qui est filtrée
       setAllProperty(formattedArticles);
 
     } catch (error) {
       console.error('[Load Articles Exception]:', error);
     } finally {
       setLoading(false);
     }
   };
  if(loding){
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="loading" size={48} color={isDark ? '#64748B' : Colors.gray400} />
        <Text style={{ marginTop: 12, color: isDark ? '#64748B' : Colors.gray500 }}>Chargement des propriétés...</Text>
      </View>
    );
  }
  const salesCount = filteredProperties.filter(p => p.listingType === 'sale').length;
  const rentalsCount = filteredProperties.filter(p => p.listingType === 'rental').length;

  return (
    <View style={styles.container}>
      <Header title="Recherche Avancée" subtitle={`${filteredProperties.length} résultats`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Summary */}
        <View style={styles.statsSummary}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="home-outline" size={20} color="#06B6D4" />
            <Text style={styles.statNumber}>{filteredProperties.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="tag-outline" size={20} color="#10B981" />
            <Text style={styles.statNumber}>{salesCount}</Text>
            <Text style={styles.statLabel}>Vente</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="key-outline" size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{rentalsCount}</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.section}>
          <SearchBar
            placeholder="Rechercher une propriété..."
            onSearch={setSearchQuery}
          />
        </View>

        {/* View Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <MaterialCommunityIcons 
              name="view-list" 
              size={20} 
              color={viewMode === 'list' ? '#FFFFFF' : isDark ? '#94A3B8' : Colors.gray500}
            />
            <Text style={[styles.toggleButtonText, viewMode === 'list' && styles.toggleButtonTextActive]}>
              Liste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <MaterialCommunityIcons 
              name="map" 
              size={20} 
              color={viewMode === 'map' ? '#FFFFFF' : isDark ? '#94A3B8' : Colors.gray500}
            />
            <Text style={[styles.toggleButtonText, viewMode === 'map' && styles.toggleButtonTextActive]}>
              Carte
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Button & Sort */}
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons name="tune-vertical" size={18} color="#FFFFFF" />
            <Text style={styles.filterButtonText}>Filtres</Text>
          </TouchableOpacity>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.sortScroll}
          >
            {[
              { id: 'recent', label: 'Récent', icon: 'clock-outline' },
              { id: 'price-low', label: 'Prix ↑', icon: 'sort-ascending' },
              { id: 'price-high', label: 'Prix ↓', icon: 'sort-descending' },
              { id: 'rating', label: 'Top Avis', icon: 'star' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.id}
                style={[
                  styles.sortButton,
                  sortBy === sort.id && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy(sort.id as any)}
              >
                <MaterialCommunityIcons 
                  name={sort.icon as any} 
                  size={14} 
                  color={sortBy === sort.id ? '#06B6D4' : isDark ? '#94A3B8' : Colors.gray600}
                />
                <Text style={[styles.sortButtonText, sortBy === sort.id && styles.sortButtonTextActive]}>
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {PropertyCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardActive,
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
              >
                <View
                  style={[
                    styles.categoryIconContainer,
                    selectedCategory === category.id && styles.categoryIconContainerActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getCategoryIcon(category.id) as any}
                    size={24}
                    color={selectedCategory === category.id ? '#06B6D4' : isDark ? '#94A3B8' : Colors.gray600}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === category.id && styles.categoryLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Layout Controls */}
        <View style={styles.layoutSection}>
          <View style={styles.layoutHeader}>
            <Text style={styles.layoutLabel}>Disposition</Text>
            <View style={styles.layoutInfoBadge}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#06B6D4" />
              <Text style={styles.layoutInfoText}>{gridColumns}x affichage</Text>
            </View>
          </View>
          <View style={styles.layoutControls}>
            {[
              { cols: 1, icon: 'view-list', label: 'Colonne' },
              { cols: 2, icon: 'view-week', label: '2 Colonnes' },
              { cols: 3, icon: 'view-grid', label: 'Grille' },
            ].map((item) => (
              <TouchableOpacity
                key={item.cols}
                style={[
                  styles.layoutButton,
                  gridColumns === item.cols && styles.layoutButtonActive,
                ]}
                onPress={() => setGridColumns(item.cols as 1 | 2 | 3)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={20}
                  color={gridColumns === item.cols ? '#FFFFFF' : '#06B6D4'}
                />
                <Text style={[
                  styles.layoutButtonLabel,
                  gridColumns === item.cols && styles.layoutButtonLabelActive,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <View style={styles.advancedFilters}>
            {/* Price Range */}
            <View style={styles.filterGroup}>
              <View style={styles.filterLabelRow}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#06B6D4" />
                <Text style={styles.filterLabel}>Prix</Text>
              </View>
              <View style={styles.priceRange}>
                <TouchableOpacity style={styles.priceButton}>
                  <Text style={styles.priceButtonText}>${priceRange.min.toLocaleString()}</Text>
                </TouchableOpacity>
                <Text style={styles.priceRangeText}>à</Text>
                <TouchableOpacity style={styles.priceButton}>
                  <Text style={styles.priceButtonText}>${priceRange.max.toLocaleString()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bedrooms */}
            <View style={styles.filterGroup}>
              <View style={styles.filterLabelRow}>
                <MaterialCommunityIcons name="bed" size={16} color="#06B6D4" />
                <Text style={styles.filterLabel}>Chambres</Text>
              </View>
              <View style={styles.buttonGroup}>
                {[0, 1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.filterOptionButton, bedrooms === num && styles.filterOptionButtonActive]}
                    onPress={() => setBedrooms(num)}
                  >
                    <Text style={[styles.filterOptionButtonText, bedrooms === num && styles.filterOptionButtonTextActive]}>
                      {num === 0 ? 'Tous' : num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bathrooms */}
            <View style={styles.filterGroup}>
              <View style={styles.filterLabelRow}>
                <MaterialCommunityIcons name="shower" size={16} color="#06B6D4" />
                <Text style={styles.filterLabel}>Salles de bain</Text>
              </View>
              <View style={styles.buttonGroup}>
                {[0, 1, 2, 3].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.filterOptionButton, bathrooms === num && styles.filterOptionButtonActive]}
                    onPress={() => setBathrooms(num)}
                  >
                    <Text style={[styles.filterOptionButtonText, bathrooms === num && styles.filterOptionButtonTextActive]}>
                      {num === 0 ? 'Tous' : num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Area */}
            <View style={styles.filterGroup}>
              <View style={styles.filterLabelRow}>
                <MaterialCommunityIcons name="ruler-square" size={16} color="#06B6D4" />
                <Text style={styles.filterLabel}>Superficie min: {minArea} m²</Text>
              </View>
              <View style={styles.buttonGroup}>
                {[0, 50, 100, 200, 500].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.filterOptionButton, minArea === num && styles.filterOptionButtonActive]}
                    onPress={() => setMinArea(num)}
                  >
                    <Text style={[styles.filterOptionButtonText, minArea === num && styles.filterOptionButtonTextActive]}>
                      {num === 0 ? 'Tous' : num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.filterGroup}>
              <View style={styles.filterLabelRow}>
                <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                <Text style={styles.filterLabel}>Note minimum: {rating}</Text>
              </View>
              <View style={styles.buttonGroup}>
                {[0, 3, 3.5, 4, 4.5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.filterOptionButton, rating === num && styles.filterOptionButtonActive]}
                    onPress={() => setRating(num)}
                  >
                    <Text style={[styles.filterOptionButtonText, rating === num && styles.filterOptionButtonTextActive]}>
                      {num === 0 ? 'Tous' : num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Results */}
        {viewMode === 'list' ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <View style={styles.resultsTitleRow}>
                <Text style={styles.resultTitle}>Résultats</Text>
                <View style={styles.resultsBadge}>
                  <Text style={styles.resultsBadgeText}>{filteredProperties.length}</Text>
                </View>
              </View>
              <Text style={styles.resultsSubtitle}>Affichage: {gridColumns === 1 ? '1' : gridColumns === 2 ? '2' : '3'} par ligne</Text>
            </View>
            {filteredProperties.length > 0 ? (
              <View style={[
                styles.grid,
                {
                  marginHorizontal: gridColumns === 1 ? 0 : -6,
                  gap: gridColumns === 1 ? 0 : 8,
                  paddingHorizontal: gridColumns === 1 ? 0 : 6,
                },
              ]}>
                {filteredProperties.map((property) => {
                  const itemWidth = gridColumns === 1 ? '100%' : gridColumns === 2 ? '50%' : '33.33%';
                  return (
                    <View
                      key={property.id}
                      style={[
                        styles.gridItem,
                        {
                          width: itemWidth,
                          paddingHorizontal: gridColumns === 1 ? 0 : 6,
                          paddingVertical: 8,
                        },
                      ]}
                    >
                      <TouchableOpacity 
                      onPress={()=>alert('Détails de la propriété à implémenter')}
                      
                      >
                      
                      <PropertyCard property={property} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify" size={48} color={isDark ? '#64748B' : Colors.gray400} />
                <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                <Text style={styles.emptySubtext}>Essayez d'ajuster vos filtres</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.resultTitle}>Carte des propriétés ({filteredProperties.length})</Text>
            <View style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <MaterialCommunityIcons name="map" size={48} color={isDark ? '#64748B' : Colors.gray400} />
                <Text style={styles.mapPlaceholderText}>Affichage des propriétés</Text>
              </View>
              <View style={styles.mapPropertyList}>
                {filteredProperties.map((property, index) => (
                  <View key={property.id} style={styles.mapMarkerItem}>
                    <View style={[styles.markerNumber, { backgroundColor: getMarkerColor(index) }]}>
                      <Text style={styles.markerNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.markerInfo}>
                      <Text style={styles.markerTitle}>{property.title}</Text>
                      <Text style={styles.markerLocation}>{property.location}</Text>
                      <Text style={styles.markerPrice}>${property.price.toLocaleString()}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#06B6D4" />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getMarkerColor = (index: number) => {
  const colors = ['#06B6D4', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#F97316'];
  return colors[index % colors.length];
};

const getCategoryIcon = (categoryId: string): string => {
  const iconMap: Record<string, string> = {
    'house': 'home',
    'apartment': 'domain',
    'land': 'tree',
    'restaurant': 'silverware-fork-knife',
    'event-space': 'party-popper',
    'gym': 'dumbbell',
    'supermarket': 'shopping',
  };
  return iconMap[categoryId] || 'home';
};

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    },
    scrollContent: {
      paddingTop:120,
      paddingBottom: 34,
    },
    section: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    toggleContainer: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#E2E8F0',
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    toggleButtonActive: {
      backgroundColor: '#06B6D4',
    },
    toggleButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : Colors.gray500,
    },
    toggleButtonTextActive: {
      color: '#FFFFFF',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: '#06B6D4',
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    advancedFilters: {
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 12,
      paddingVertical: 16,
      borderRadius: 12,
      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#E2E8F0',
      gap: 12,
    },
    filterGroup: {
      gap: 8,
      marginBottom: 12,
    },
    filterLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    filterTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#0F172A',
      marginBottom: 8,
    },
    filterLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#CBD5E1' : '#0F172A',
    },
    filterScroll: {
      gap: 8,
    },
    priceRange: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    priceButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.05)',
      borderWidth: 1,
      borderColor: '#06B6D4',
    },
    priceButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#06B6D4',
      textAlign: 'center',
    },
    priceRangeText: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : Colors.gray500,
    },
    buttonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    filterOptionButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.1)',
    },
    filterOptionButtonActive: {
      backgroundColor: '#06B6D4',
      borderColor: '#06B6D4',
    },
    filterOptionButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#06B6D4',
    },
    filterOptionButtonTextActive: {
      color: '#FFFFFF',
    },
    resultTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#F1F5F9' : '#0F172A',
      marginBottom: 12,
    },
    mapContainer: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? Colors.dark.surface : '#F8FAFC',
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.border : '#E2E8F0',
    },
    mapPlaceholder: {
      height: 200,
      backgroundColor: isDark ? Colors.dark.border : '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    mapPlaceholderText: {
      fontSize: 13,
      color: isDark ? '#64748B' : Colors.gray500,
      fontWeight: '500',
    },
    mapPropertyList: {
      gap: 1,
      maxHeight: 400,
    },
    mapMarkerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.dark.border : '#E2E8F0',
    },
    markerNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    markerNumberText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    markerInfo: {
      flex: 1,
      gap: 2,
    },
    markerTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : '#0F172A',
    },
    markerLocation: {
      fontSize: 11,
      color: isDark ? '#94A3B8' : Colors.gray500,
    },
    markerPrice: {
      fontSize: 12,
      fontWeight: '700',
      color: '#06B6D4',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyText: {
      color: isDark ? Colors.dark.text : Colors.black,
      fontSize: 15,
      fontWeight: '600',
    },
    emptySubtext: {
      color: isDark ? '#94A3B8' : Colors.gray500,
      fontSize: 12,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : '#0F172A',
      marginBottom: 12,
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
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 10,
      minWidth: 75,
    },
    categoryCardActive: {
      backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.08)',
    },
    categoryIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? Colors.dark.surface : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.border : '#E2E8F0',
    },
    categoryIconContainerActive: {
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      borderColor: '#06B6D4',
      borderWidth: 2,
    },
    categoryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : Colors.gray600,
      textAlign: 'center',
    },
    categoryLabelActive: {
      color: '#06B6D4',
      fontWeight: '700',
    },
    layoutSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? Colors.dark.surface : '#F8FAFC',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.dark.border : '#E2E8F0',
    },
    layoutHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    layoutLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : '#0F172A',
    },
    layoutInfoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(6, 182, 212, 0.2)',
    },
    layoutInfoText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#06B6D4',
    },
    layoutControls: {
      flexDirection: 'row',
      gap: 8,
    },
    layoutButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: isDark ? Colors.dark.background : '#FFFFFF',
      borderWidth: 2,
      borderColor: '#06B6D4',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    layoutButtonActive: {
      backgroundColor: '#06B6D4',
      borderColor: '#06B6D4',
    },
    layoutButtonLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#06B6D4',
    },
    layoutButtonLabelActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    resultsSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    resultsHeader: {
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.dark.border : '#E2E8F0',
    },
    resultsTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    resultsBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: '#06B6D4',
      minWidth: 32,
      alignItems: 'center',
    },
    resultsBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    resultsSubtitle: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : Colors.gray600,
      fontWeight: '500',
    },
    layoutPreview: {
      flexDirection: 'row',
      gap: 2,
      width: '100%',
      height: 24,
    },
    layoutPreviewItem: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: '#06B6D4',
      opacity: 1,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8,
    },
    gridItem: {
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    statsSummary: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? Colors.dark.surface : '#F8FAFC',
      marginHorizontal: 0,
      marginBottom: 12,
      justifyContent: 'space-between',
    },
    statCard: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark ? Colors.dark.background : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.border : '#E2E8F0',
      alignItems: 'center',
      gap: 4,
    },
    statNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: '#06B6D4',
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : Colors.gray600,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    sortScroll: {
      flex: 1,
      gap: 6,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 6,
      backgroundColor: isDark ? Colors.dark.surface : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? Colors.dark.border : '#E2E8F0',
    },
    sortButtonActive: {
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      borderColor: '#06B6D4',
    },
    sortButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? Colors.dark.text : '#0F172A',
    },
    sortButtonTextActive: {
      color: '#06B6D4',
      fontWeight: '700',
    },
  });
