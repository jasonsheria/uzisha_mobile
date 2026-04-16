// ...existing code...
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
  Dimensions,
  Linking,
  Animated,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useAdmin, AdminArticle } from '@/contexts/AdminContext';
import { CategoryAttributes } from '@/constants/PropertyCategories';
import {
  pickImage,
  pickVideo,
  uploadPropertyImage,
  uploadPropertyVideo,
  uploadMultipleImages,
  uploadMultipleVideos,
} from '@/utils/uploadService';

const { width } = Dimensions.get('window');

// Categories avec icons
const MAIN_CATEGORIES = [
  { label: 'Maison', value: 'house', icon: 'home' },
  { label: 'Appartement', value: 'apartment', icon: 'door-sliding' },
  { label: 'Terrain', value: 'land', icon: 'tree' },
  { label: 'Restaurant', value: 'restaurant', icon: 'silverware-fork-knife' },
  { label: 'Salle de fête', value: 'event-space', icon: 'party-popper' },
  { label: 'Salle Sport', value: 'gym', icon: 'dumbbell' },
  { label: 'Supermarché', value: 'supermarket', icon: 'shopping' },
  { label: 'Produits', value: 'product', icon: 'package' },
];

const EXTRA_CATEGORIES = [
  { label: 'Vêtements Homme', value: 'clothing_men', icon: 'tshirt-crew' },
  { label: 'Vêtements Femme', value: 'clothing_women', icon: 'tshirt-crew-outline' },
  { label: 'Vêtements Enfants', value: 'clothing_children', icon: 'baby-face-outline' },
  { label: 'Chaussures Homme', value: 'shoes_men', icon: 'shoe-formal' },
  { label: 'Chaussures Femme', value: 'shoes_women', icon: 'shoe-heel' },
  { label: 'Chaussures Enfants', value: 'shoes_children', icon: 'shoe-ballet' },
  { label: 'Ceinture', value: 'belt', icon: 'belt' },
  { label: 'Jacket', value: 'jacket', icon: 'hanger' },
  { label: 'Veste', value: 'vest', icon: 'hanger' },
  { label: 'Chapeau', value: 'hat', icon: 'hat-fedora' },
  { label: 'Téléphone', value: 'phone', icon: 'cellphone' },
  { label: 'Écouteurs', value: 'earphones', icon: 'headphones' },
  { label: 'Chargeur', value: 'charger', icon: 'battery-charging' },
  { label: 'Power Bank', value: 'powerbank', icon: 'battery' },
  { label: 'Accessoires Téléphone', value: 'phone_accessories', icon: 'cellphone-cog' },
  { label: 'Ordinateur', value: 'computer', icon: 'laptop' },
  { label: 'Frigo', value: 'fridge', icon: 'fridge-outline' },
  { label: 'Congélateur', value: 'freezer', icon: 'snowflake' },
  { label: 'Étagère', value: 'shelf', icon: 'bookshelf' },
  { label: 'Canapé', value: 'sofa', icon: 'sofa' },
  { label: 'Autres Produits', value: 'other_products', icon: 'package-variant' },
];

const CATEGORIES = [...MAIN_CATEGORIES];

// Définition des champs dynamiques par catégorie
const CATEGORY_DETAILS_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'number' | 'select'; options?: string[] }>> = {
  phone: [
    { key: 'marque', label: 'Marque', type: 'select', options: ['iPhone', 'Samsung', 'Tecno', 'LG', 'Oppo', 'Huawei', 'Autre'] },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  clothing_men: [
    { key: 'type', label: 'Type', type: 'select', options: ['Pantalon', 'Chemise', 'T-shirt', 'Costume', 'Autre'] },
    { key: 'taille', label: 'Taille', type: 'text' },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  clothing_women: [
    { key: 'type', label: 'Type', type: 'select', options: ['Robe', 'Jupe', 'Pantalon', 'Blouse', 'Autre'] },
    { key: 'taille', label: 'Taille', type: 'text' },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  clothing_children: [
    { key: 'type', label: 'Type', type: 'select', options: ['Garçon', 'Fille', 'Bébé', 'Autre'] },
    { key: 'taille', label: 'Taille', type: 'text' },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  shoes_men: [
    { key: 'pointure', label: 'Pointure', type: 'text' },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  shoes_women: [
    { key: 'pointure', label: 'Pointure', type: 'text' },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  shoes_children: [
    { key: 'pointure', label: 'Pointure', type: 'text' },
    { key: 'couleur', label: 'Couleur', type: 'text' },
  ],
  computer: [
    { key: 'marque', label: 'Marque', type: 'text' },
    { key: 'ram', label: 'RAM', type: 'text' },
    { key: 'stockage', label: 'Stockage', type: 'text' },
  ],
  fridge: [
    { key: 'marque', label: 'Marque', type: 'text' },
    { key: 'capacite', label: 'Capacité (L)', type: 'text' },
  ],
  freezer: [
    { key: 'marque', label: 'Marque', type: 'text' },
    { key: 'capacite', label: 'Capacité (L)', type: 'text' },
  ],
  
};
// Étapes du formulaire
type FormStep = 1 | 2 | 3 | 4;

interface FormDataExtended extends Partial<AdminArticle> {
  beds?: number;
  baths?: number;
  area?: number;
  living_area?: number;
  kitchen_area?: number;
  parking_spaces?: number;
  [key: string]: any;
}

export default function ArticlesScreen() {
  const isDark = useColorScheme() === 'dark';
  const { articles, addArticle, updateArticle, deleteArticle, loadArticles } = useAdmin();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [mediaTab, setMediaTab] = useState<'images' | 'videos'>('images');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [scaleAnim] = useState(new Animated.Value(1));

  // Lightbox states
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');

  const [formData, setFormData] = useState<FormDataExtended>({
    title: '',
    type: 'house',
    listingType: 'sale',
    price: 0,
    visitPrice: 0,
    location: '',
    description: '',
    image: '',
    images: [],
    videos: [],
    beds: 0,
    baths: 0,
    area: 0,
    living_area: 0,
    kitchen_area: 0,
    parking_spaces: 0,
    details: {},
  });

  const isRealEstate = ['house', 'apartment'].includes(formData.type || '');

  // Filter & Pagination States
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedListingType, setSelectedListingType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [gridColumns, setGridColumns] = useState(1);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'oldest'>('newest');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showListingTypeModal, setShowListingTypeModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showItemsPerPageModal, setShowItemsPerPageModal] = useState(false);

  // Filter articles based on search and filters
  let filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchText.toLowerCase()) ||
      article.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      article.location.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = !selectedCategory || article.type === selectedCategory;
    const matchesListingType = !selectedListingType || article.listingType === selectedListingType;

    return matchesSearch && matchesCategory && matchesListingType;
  });

  // Sort articles
  filteredArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + itemsPerPage);

  const triggerSuccessAnimation = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormStep(1);
    setFormData({
      title: '',
      type: 'house',
      listingType: 'sale',
      price: 0,
      visitPrice: 0,
      location: '',
      description: '',
      image: '',
      images: [],
      videos: [],
      beds: 0,
      baths: 0,
      area: 0,
      living_area: 0,
      kitchen_area: 0,
      parking_spaces: 0,
      details: {},
    });
    setModalVisible(true);
  };

  const handleEdit = (article: AdminArticle) => {
    setEditingId(article.id);
    setFormStep(1);
    setFormData({
      ...article,
      images: article.images || [],
      videos: article.videos || [],
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'Êtes-vous certain de vouloir supprimer cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteArticle(id),
        },
      ]
    );
  };

  // Lightbox functions
  const handleOpenLightbox = (article: AdminArticle) => {
    const allMedia = [
      ...(article.images || []).map((url) => ({ url, type: 'image' as const })),
      ...(article.videos || []).map((url) => ({ url, type: 'video' as const })),
    ];

    if (allMedia.length === 0) {
      Alert.alert('Aucun média', 'Cet article n\'a pas de médias');
      return;
    }

    setSelectedArticle(article);
    setCurrentMediaIndex(0);
    setCurrentMediaType(allMedia[0].type);
    setLightboxVisible(true);
  };

  const getAllMedia = () => {
    if (!selectedArticle) return [];
    return [
      ...(selectedArticle.images || []).map((url) => ({ url, type: 'image' as const })),
      ...(selectedArticle.videos || []).map((url) => ({ url, type: 'video' as const })),
    ];
  };

  const allMedia = getAllMedia();
  const currentMedia = allMedia[currentMediaIndex];

  const handleNextMedia = () => {
    if (currentMediaIndex < allMedia.length - 1) {
      const nextIndex = currentMediaIndex + 1;
      setCurrentMediaIndex(nextIndex);
      setCurrentMediaType(allMedia[nextIndex].type);
    }
  };

  const handlePrevMedia = () => {
    if (currentMediaIndex > 0) {
      const prevIndex = currentMediaIndex - 1;
      setCurrentMediaIndex(prevIndex);
      setCurrentMediaType(allMedia[prevIndex].type);
    }
  };

  const handleSelectMedia = (index: number) => {
    setCurrentMediaIndex(index);
    setCurrentMediaType(allMedia[index].type);
  };

  const getVideoPlayerHTML = (videoUrl: string) => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background-color: black; overflow: hidden; }
          .container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; }
          video { width: 100%; height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <div class="container">
          <video id="videoPlayer" controls autoplay playsinline>
            <source src="${videoUrl}" type="video/mp4">
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      </body>
    </html>
  `;
  };

  const handleNextStep = () => {
    // Validation
    if (formStep === 1) {
      if (!formData.type) {
        Alert.alert('Erreur', 'Veuillez sélectionner un type');
        return;
      }
    } else if (formStep === 2) {
      if (!formData.title || !formData.location) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
        return;
      }
    } else if (formStep === 3) {
      if (!formData.price) {
        Alert.alert('Erreur', 'Veuillez entrer un prix');
        return;
      }
    }

    if (formStep < 4) {
      setFormStep((formStep + 1) as FormStep);
    }
  };

  const handlePrevStep = () => {
    if (formStep > 1) {
      setFormStep((formStep - 1) as FormStep);
    }
  };

  const handlePickImage = async () => {
    try {
      setUploading(true);
      setUploadProgress('Sélection de l\'image...');
      const imageUri = await pickImage();

      if (!imageUri) {
        setUploading(false);
        return;
      }

      setUploadProgress('Image sélectionnée...');
      const images = formData.images || [];
      setFormData({ ...formData, images: [...images, imageUri] });

      setUploading(false);
      setUploadProgress('');
    } catch (error) {
      console.error('[Pick Image Error]:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handlePickVideo = async () => {
    try {
      setUploading(true);
      setUploadProgress('Sélection de la vidéo...');
      const videoUri = await pickVideo();

      if (!videoUri) {
        setUploading(false);
        return;
      }

      setUploadProgress('Vidéo sélectionnée...');
      const videos = formData.videos || [];
      setFormData({ ...formData, videos: [...videos, videoUri] });

      setUploading(false);
      setUploadProgress('');
    } catch (error) {
      console.error('[Pick Video Error]:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo');
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleRemoveMedia = (url: string, type: 'images' | 'videos') => {
    if (type === 'images') {
      setFormData({
        ...formData,
        images: (formData.images || []).filter(img => img !== url),
      });
    } else {
      setFormData({
        ...formData,
        videos: (formData.videos || []).filter(video => video !== url),
      });
    }
  };

  const handlePlayVideo = (videoUrl: string) => {
    if (videoUrl.startsWith('file://') || videoUrl.includes('Documents')) {
      Alert.alert(
        'Vidéo locale',
        'Cette vidéo sera disponible pour la lecture après avoir créé l\'annonce et uploadé les fichiers.'
      );
      return;
    }

    Linking.openURL(videoUrl).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la vidéo');
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Préparer les champs dynamiques pour la colonne details
    let details: Record<string, any> = {};
    if (formData.type && CATEGORY_DETAILS_FIELDS[formData.type]) {
      CATEGORY_DETAILS_FIELDS[formData.type].forEach(field => {
        if (formData[field.key] !== undefined && formData[field.key] !== '') {
          details[field.key] = formData[field.key];
        }
      });
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress('0%');
      setUploadMessage('Initialisation...');

      if (editingId) {
        // Mode édition
        setUploadMessage('Mise à jour de l\'annonce...');
        const success = await updateArticle(editingId, {
          ...formData,
          details,
        });
        if (success) {
          setUploadStatus('success');
          setUploadMessage('Annonce mise à jour avec succès!');
          triggerSuccessAnimation();
          setTimeout(() => {
            setModalVisible(false);
            setUploadStatus('idle');
            setUploadProgress('');
          }, 2000);
        } else {
          setUploadStatus('error');
          setUploadMessage('Impossible de mettre à jour l\'annonce');
          setTimeout(() => setUploadStatus('idle'), 2000);
        }
      } else {
        // Mode création
        setUploadMessage('Création de l\'annonce...');
        setUploadProgress('20%');

        const newArticle = await addArticle({
          title: formData.title!,
          type: formData.type as any,
          listingType: formData.listingType as any,
          price: formData.price || 0,
          visitPrice: formData.visitPrice || 0,
          location: formData.location!,
          description: formData.description || '',
          
          image: formData.image || (formData.images && formData.images[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500',
          images: [],
          videos: [],
          details : formData.details || {},
        });

        if (!newArticle) {
          setUploadStatus('error');
          setUploadMessage('Impossible de créer l\'annonce');
          setTimeout(() => setUploadStatus('idle'), 2000);
          return;
        }

        const localImages = (formData.images || []).filter(img => img.startsWith('file://') || img.includes('Documents'));
        const remoteImages = (formData.images || []).filter(img => !img.startsWith('file://') && !img.includes('Documents'));
        const localVideos = (formData.videos || []).filter(vid => vid.startsWith('file://') || vid.includes('Documents'));
        const remoteVideos = (formData.videos || []).filter(vid => !vid.startsWith('file://') && !vid.includes('Documents'));
        const totalMedia = localImages.length + localVideos.length;

        let uploadedCount = 0;

        if (localImages.length > 0) {
          setUploadMessage(`Upload des images (${localImages.length})...`);
          const uploadedImageUrls = await uploadMultipleImages(localImages, newArticle.id);
          remoteImages.push(...uploadedImageUrls);
          uploadedCount += localImages.length;
          const progress = Math.round((uploadedCount / (totalMedia || 1)) * 60 + 20);
          setUploadProgress(`${progress}%`);
        }

        if (localVideos.length > 0) {
          setUploadMessage(`Upload des vidéos (${localVideos.length})...`);
          const uploadedVideoUrls = await uploadMultipleVideos(localVideos, newArticle.id);
          remoteVideos.push(...uploadedVideoUrls);
          uploadedCount += localVideos.length;
          const progress = Math.round((uploadedCount / (totalMedia || 1)) * 60 + 20);
          setUploadProgress(`${progress}%`);
        }

        setUploadProgress('90%');
        setUploadMessage('Finalisation...');

        if (remoteImages.length > 0 || remoteVideos.length > 0) {
          await updateArticle(newArticle.id, {
            images: remoteImages,
            videos: remoteVideos,
            image: remoteImages[0] || newArticle.image,
          });
        }

        setUploadProgress('100%');
        setUploadStatus('success');
        setUploadMessage('Annonce créée avec succès!');
        triggerSuccessAnimation();

        // Refresh articles list to show newly created article with all media
        await loadArticles();

        setTimeout(() => {
          setModalVisible(false);
          setUploadStatus('idle');
          setUploadProgress('');
          setFormStep(1);
        }, 2000);
      }
    } catch (error) {
      console.error('[Save Article Error]:', error);
      setUploadStatus('error');
      setUploadMessage('Une erreur est survenue lors de la sauvegarde');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      {/* Enhanced Header with Stats */}
      <View style={[styles.headerContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
        {/* Top Section - Title & Add Button */}
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              ✨ Mes Annonces
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Gérez et publiez vos propriétés
            </Text>
          </View>
            <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.addBtnEnhanced} onPress={handleAdd}>
            <LinearGradient
              colors={['#06B6D4', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addBtnGradient}
            >
              <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />

            </LinearGradient>
          </TouchableOpacity>
          {/* Ajoute un text en dessous du boutton */}
          <Text style={[styles.addBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Ajouter une annonce
          </Text>
          </View>

        </View>


      </View>

      {/* Filter Bar - Enhanced */}
      <View style={[styles.filterBarContainer, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
        {/* Search Box - Enhanced */}


        {/* Filters Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScrollRow} contentContainerStyle={styles.filterButtonsContainer}>
          {/* Category Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCategory && { backgroundColor: '#06B6D4' },
              { borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={16}
              color={selectedCategory ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
            />
            <Text style={[styles.filterChipText, selectedCategory && { color: '#FFFFFF' }, !selectedCategory && { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {selectedCategory ? ([...CATEGORIES, ...EXTRA_CATEGORIES].find(c => c.value === selectedCategory)?.label) : 'Catégorie'}
            </Text>
          </TouchableOpacity>

          {/* Listing Type Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedListingType && { backgroundColor: '#06B6D4' },
              { borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }
            ]}
            onPress={() => setShowListingTypeModal(true)}
          >
            <MaterialCommunityIcons
              name="home-group"
              size={16}
              color={selectedListingType ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
            />
            <Text style={[styles.filterChipText, selectedListingType && { color: '#FFFFFF' }, !selectedListingType && { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {selectedListingType ? (selectedListingType === 'sale' ? 'Vente' : 'Location') : 'Type'}
            </Text>
          </TouchableOpacity>

          {/* Sort Filter */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              sortBy !== 'newest' && { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
              { borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }
            ]}
            onPress={() => setShowSortModal(true)}
          >
            <MaterialCommunityIcons
              name="sort"
              size={16}
              color={isDark ? '#94A3B8' : '#64748B'}
            />
            <Text style={[styles.filterChipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Tri
            </Text>
          </TouchableOpacity>


          {/* Voir plus - Extra Categories */}
          <TouchableOpacity
            style={[styles.filterChip, { borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)' }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <MaterialCommunityIcons name="dots-horizontal" size={16} color={isDark ? '#94A3B8' : '#64748B'} />
            <Text style={[styles.filterChipText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Voir plus</Text>
          </TouchableOpacity>

          {/* Reset Filters Button */}
          {(selectedCategory || selectedListingType || searchText) && (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  borderColor: 'rgba(244, 63, 94, 0.3)'
                }
              ]}
              onPress={() => {
                setSearchText('');
                setSelectedCategory(null);
                setSelectedListingType(null);
                setSortBy('newest');
                setCurrentPage(1);
              }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={16}
                color="#F43F5E"
              />
              <Text style={[styles.filterChipText, { color: '#F43F5E' }]}>
                Réinitialiser
              </Text>
            </TouchableOpacity>
          )}

        </ScrollView>

        {/* Active Filters Row */}
        {(selectedCategory || selectedListingType || searchText) && (
          <View style={styles.activeFiltersSection}>
            <View style={styles.activeFiltersHeader}>
              <MaterialCommunityIcons name="filter-check" size={16} color="#06B6D4" />
              <Text style={[styles.activeFiltersLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Filtres actifs
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersList} contentContainerStyle={styles.activeFiltersContent}>
              {searchText && (
                <View style={[styles.activeFilterBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                  <MaterialCommunityIcons name="magnify" size={13} color="#06B6D4" />
                  <Text style={[styles.activeFilterText, { color: '#06B6D4' }]}>
                    "{searchText}"
                  </Text>
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <MaterialCommunityIcons name="close" size={13} color="#06B6D4" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedCategory && (
                <View style={[styles.activeFilterBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                  <MaterialCommunityIcons name="filter-variant" size={13} color="#06B6D4" />
                  <Text style={[styles.activeFilterText, { color: '#06B6D4' }]}>
                    {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                    <MaterialCommunityIcons name="close" size={13} color="#06B6D4" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedListingType && (
                <View style={[styles.activeFilterBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                  <MaterialCommunityIcons name="home-search" size={13} color="#06B6D4" />
                  <Text style={[styles.activeFilterText, { color: '#06B6D4' }]}>
                    {selectedListingType === 'sale' ? 'Vente' : 'Location'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedListingType(null)}>
                    <MaterialCommunityIcons name="close" size={13} color="#06B6D4" />
                  </TouchableOpacity>
                </View>
              )}
              {(selectedCategory || selectedListingType || searchText) && (
                <TouchableOpacity
                  style={[styles.activeFilterBadge, { backgroundColor: 'rgba(244, 63, 94, 0.15)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                  onPress={() => {
                    setSearchText('');
                    setSelectedCategory(null);
                    setSelectedListingType(null);
                    setCurrentPage(1);
                  }}
                >
                  <MaterialCommunityIcons name="refresh" size={13} color="#F43F5E" />
                  <Text style={[styles.activeFilterText, { color: '#F43F5E' }]}>
                    Réinitialiser
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Articles Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 80 }]}>
        {filteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="home-outline" size={60} color={isDark ? '#94A3B8' : '#CBD5E1'} />
            <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : '#64748B', marginTop: 16 }]}>
              {searchText || selectedCategory || selectedListingType ? 'Aucun résultat trouvé' : 'Aucune annonce pour le moment'}
            </Text>
          </View>
        ) : (
          <React.Fragment>
            <View style={[styles.articlesGrid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
              {paginatedArticles.map((article, index) => {
                const categoryLabel = CATEGORIES.find(c => c.value === article.type)?.label || article.type;
                const isRealEstate = ['house', 'apartment'].includes(article.type || '');
                const cardWidth = gridColumns === 1 ? '100%' : 'calc(50% - 6px)';
                return (
                  <View key={article.id} style={{ width: gridColumns === 1 ? '100%' : '50%', paddingRight: gridColumns === 1 ? 0 : index % 2 === 0 ? 12 : 0, marginBottom: 12 }}>
                    <View style={[styles.articleCard, { backgroundColor: isDark ? '#1A2332' : '#FFFFFF', borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)', shadowColor: isDark ? '#000000' : '#06B6D4', shadowOpacity: isDark ? 0.5 : 0.2, shadowRadius: 16, elevation: isDark ? 12 : 10 }]}>
                      {/* Image Section with Premium Overlay */}
                      <TouchableOpacity
                        style={styles.imageContainer}
                        onPress={() => handleOpenLightbox(article)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: article.image }} style={styles.mainImage} />
                        <View style={styles.imageOverlay} />
                        <View style={[styles.typeBadgeCard, { backgroundColor: 'rgba(99, 102, 241, 0.95)' }]}>
                          <MaterialCommunityIcons name="star" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.typeBadgeText}>{categoryLabel}</Text>
                        </View>
                        {(article.images && article.images.length > 0) || (article.videos && article.videos.length > 0) ? (
                          <View style={[styles.mediaCountBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
                            <MaterialCommunityIcons name="image-multiple" size={12} color="#FFFFFF" />
                            <Text style={styles.mediaCountText}>
                              {(article.images?.length || 0) + (article.videos?.length || 0)}
                            </Text>
                          </View>
                        ) : null}
                        <View style={[styles.listingBadge, { backgroundColor: article.listingType === 'sale' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(245, 158, 11, 0.95)', paddingHorizontal: 10, paddingVertical: 6 }]}>
                          <MaterialCommunityIcons name={article.listingType === 'sale' ? 'home-heart' : 'home-city'} size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.listingBadgeText}>
                            {article.listingType === 'sale' ? 'Vente' : 'Location'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View style={[styles.articleContent, { paddingBottom: 10, paddingHorizontal: 14 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <Text style={[styles.articleTitle, { color: isDark ? '#F1F5F9' : '#0F172A', flex: 1 }]} numberOfLines={2}>
                            {article.title}
                          </Text>
                          <View style={{ backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8 }}>
                            <Text style={[{ color: isDark ? '#06B6D4' : '#4F46E5', fontSize: 13, fontWeight: '800' }]}>
                              ${article.price.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.locationRow}>
                          <MaterialCommunityIcons name="map-marker" size={13} color={isDark ? '#06B6D4' : '#0E7490'} />
                          <Text style={[styles.articleLocation, { color: isDark ? '#94A3B8' : '#64748B', flex: 1, marginLeft: 4 }]} numberOfLines={1}>
                            {article.location}
                          </Text>
                        </View>
                        {article.description && (
                          <Text style={[styles.descriptionSnippet, { color: isDark ? '#94A3B8' : '#64748B', marginTop: 6 }]} numberOfLines={2}>
                            {article.description}
                          </Text>
                        )}
                        
                        {article.type && CategoryAttributes[article.type as keyof typeof CategoryAttributes] && (
                          <View style={{ marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#E2E8F0' }}>
                            {CategoryAttributes[article.type as keyof typeof CategoryAttributes].map((attr: string) => {
                              const value = (article as any)[attr];
                              return value ? (
                                <View key={attr} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                  <MaterialCommunityIcons
                                    name="information-outline"
                                    size={14}
                                    color="#06B6D4"
                                    style={{ marginRight: 8 }}
                                  />
                                  <Text style={{
                                    color: isDark ? '#f5f9ff' : '#64748B',
                                    fontSize: 13,
                                    fontWeight: '600'
                                  }}>
                                    {attr.charAt(0).toUpperCase() + attr.slice(1)}:
                                  </Text>
                                  <Text style={{
                                    color: isDark ? '#F1F5F9' : '#0F172A',
                                    fontSize: 13,
                                    marginLeft: 6,
                                    flex: 1
                                  }}>
                                    {String(value)}
                                  </Text>
                                </View>
                              ) : null;
                            })}
                          </View>
                        )}
                        {isRealEstate && (
                          <View style={styles.realEstateDetailsSection}>
                            <View style={[styles.detailsSpecRow, { gap: 8 }]}>
                              <View style={styles.specBadgeMinimal}>
                                <MaterialCommunityIcons name="bed" size={18} color="#10B981" />
                                <Text style={[styles.specValueMinimal, { color: isDark ? '#10B981' : '#059669' }]}> {article.beds ?? 0} </Text>
                              </View>
                              <View style={styles.specBadgeMinimal}>
                                <MaterialCommunityIcons name="shower" size={18} color="#06B6D4" />
                                <Text style={[styles.specValueMinimal, { color: isDark ? '#06B6D4' : '#0891B2' }]}> {article.baths ?? 0} </Text>
                              </View>
                              <View style={styles.specBadgeMinimal}>
                                <MaterialCommunityIcons name="floor-plan" size={18} color="#F59E0B" />
                                <Text style={[styles.specValueMinimal, { color: isDark ? '#F59E0B' : '#D97706' }]}> {article.area ?? 0} </Text>
                              </View>
                              <View style={styles.specBadgeMinimal}>
                                <MaterialCommunityIcons name="car" size={18} color="#EF4444" />
                                <Text style={[styles.specValueMinimal, { color: isDark ? '#EF4444' : '#DC2626' }]}> {article.parking_spaces ?? 0} </Text>
                              </View>
                            </View>
                            {(article.living_area || article.kitchen_area) && (
                              <View style={[styles.additionalAreasSection, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)', borderRadius: 10 }]}>
                                {article.living_area ? (
                                  <View style={styles.areaDetailRow}>
                                    <View style={[styles.areaDetailIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
                                      <MaterialCommunityIcons name="sofa" size={16} color="#06B6D4" />
                                    </View>
                                    <View style={styles.areaDetailContent}>
                                      <Text style={[styles.areaDetailLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}> Salon/Séjour </Text>
                                      <Text style={[styles.areaDetailValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}> {article.living_area} m² </Text>
                                    </View>
                                  </View>
                                ) : null}
                                {article.kitchen_area ? (
                                  <View style={styles.areaDetailRow}>
                                    <View style={[styles.areaDetailIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
                                      <MaterialCommunityIcons name="chef-hat" size={16} color="#06B6D4" />
                                    </View>
                                    <View style={styles.areaDetailContent}>
                                      <Text style={[styles.areaDetailLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}> Cuisine </Text>
                                      <Text style={[styles.areaDetailValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}> {article.kitchen_area} m² </Text>
                                    </View>
                                  </View>
                                ) : null}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <View style={styles.articleActions}>
                        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => handleEdit(article)}>
                          <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Modifier</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(article.id)}>
                          <MaterialCommunityIcons name="delete" size={18} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Supprimer</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            {totalPages > 1 && (
              <View style={[styles.paginationContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)', borderTopColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
                <View style={styles.paginationInfo}>
                  <View style={styles.paginationInfoLeft}>
                    <Text style={[styles.paginationText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      Affichage {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredArticles.length)} sur {filteredArticles.length}
                    </Text>
                  </View>
                  <TouchableOpacity style={[styles.itemsPerPageBtn, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)', borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)' }]} onPress={() => setShowItemsPerPageModal(true)}>
                    <Text style={[styles.itemsPerPageText, { color: isDark ? '#06B6D4' : '#4F46E5' }]}>
                      {itemsPerPage}/page
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.paginationNavigation}>
                  <TouchableOpacity style={[styles.paginationBtn, currentPage === 1 && styles.paginationBtnDisabled]} onPress={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 1 ? (isDark ? '#475569' : '#CBD5E1') : '#06B6D4'} />
                  </TouchableOpacity>
                  <View style={styles.paginationPages}>
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }
                      return (
                        <TouchableOpacity key={pageNum} style={[styles.pageBtn, currentPage === pageNum && { backgroundColor: '#06B6D4', borderColor: '#06B6D4' }]} onPress={() => setCurrentPage(pageNum)}>
                          <Text style={[styles.pageBtnText, currentPage === pageNum && { color: '#FFFFFF', fontWeight: '800' }]}>
                            {pageNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity style={[styles.paginationBtn, currentPage === totalPages && styles.paginationBtnDisabled]} onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage === totalPages ? (isDark ? '#475569' : '#CBD5E1') : '#06B6D4'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </React.Fragment>
        )}
      </ScrollView>

      {/* Multi-Step Form Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#F1F5F9' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              {editingId ? 'Modifier l\'annonce' : 'Ajouter une annonce'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((step) => (
              <View key={step} style={styles.progressBar}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: step <= formStep ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.1)',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: step <= formStep ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                      fontSize: 10,
                      fontWeight: '700',
                    }}
                  >
                    {step}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Form Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!uploading}
            pointerEvents={uploading ? 'none' : 'auto'}
          >
            {/* STEP 1: Type & Category */}
            {formStep === 1 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Type d'annonce
                </Text>
                <Text style={[styles.sectionDescription, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Sélectionnez ce que vous voulez vendre ou louer
                </Text>

                <View style={styles.categoryGrid}>
                  {[...CATEGORIES, ...EXTRA_CATEGORIES].map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryCard,
                        {
                          backgroundColor:
                            formData.type === cat.value
                              ? 'rgba(99, 102, 241, 0.2)'
                              : isDark
                                ? '#1E293B'
                                : '#F1F5F9',
                          borderColor:
                            formData.type === cat.value ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                        },
                      ]}
                      onPress={() => setFormData({ ...formData, type: cat.value as any })}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon as any}
                        size={28}
                        color={formData.type === cat.value ? '#06B6D4' : isDark ? '#94A3B8' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.categoryCardLabel,
                          {
                            color: formData.type === cat.value ? '#06B6D4' : isDark ? '#F1F5F9' : '#0F172A',
                            fontWeight: formData.type === cat.value ? '700' : '600',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Type de listing */}
                {formData.type && (
                  <View style={[styles.formGroup, { marginTop: 24 }]}>
                    <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Type de listing</Text>
                    <View style={styles.buttonGroup}>
                      <TouchableOpacity
                        style={[styles.typeBtn, { backgroundColor: formData.listingType === 'sale' ? '#10B981' : isDark ? '#1E293B' : '#F1F5F9', borderColor: formData.listingType === 'sale' ? '#10B981' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}
                        onPress={() => setFormData({ ...formData, listingType: 'sale' })}
                      >
                        <MaterialCommunityIcons name="tag-multiple" size={18} color={formData.listingType === 'sale' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} />
                        <Text style={[styles.typeBtnText, { color: formData.listingType === 'sale' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A' }]}>Vente</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeBtn, { backgroundColor: formData.listingType === 'rental' ? '#F59E0B' : isDark ? '#1E293B' : '#F1F5F9', borderColor: formData.listingType === 'rental' ? '#F59E0B' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}
                        onPress={() => setFormData({ ...formData, listingType: 'rental' })}
                      >
                        <MaterialCommunityIcons name="key" size={18} color={formData.listingType === 'rental' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'} />
                        <Text style={[styles.typeBtnText, { color: formData.listingType === 'rental' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A' }]}>Location</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* STEP 2: Basic Info */}
            {formStep === 2 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Informations de base
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Titre *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                      },
                    ]}
                    placeholder="Ex: Maison confortable à Goma"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    value={formData.title || ''}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}> Adresse *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                      },
                    ]}
                    placeholder="Ex: Goma, Quartier X"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    value={formData.location || ''}
                    onChangeText={(text) => setFormData({ ...formData, location: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Description</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                      },
                    ]}
                    placeholder="Décrivez votre annonce..."
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    multiline
                    numberOfLines={5}
                    value={formData.description || ''}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                  />
                </View>
              </View>
            )}

            {/* STEP 3: Pricing & Details */}
            {formStep === 3 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Tarification & Détails
                </Text>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Prix *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                      },
                    ]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    keyboardType="numeric"
                    value={String(formData.price || '')}
                    onChangeText={(text) => setFormData({ ...formData, price: parseInt(text) || 0 })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}> Prix de visite</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                      },
                    ]}
                    placeholder="0"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    keyboardType="numeric"
                    value={String(formData.visitPrice || '')}
                    onChangeText={(text) => setFormData({ ...formData, visitPrice: parseInt(text) || 0 })}
                  />
                </View>
                {/* Remplacez votre boucle d'attributs par celle-ci */}
                {formData.type && CategoryAttributes[formData.type as keyof typeof CategoryAttributes] && (
                  <View style={styles.dynamicAttributesContainer}>
                  <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}> Ajouter des détails </Text>

                    {CategoryAttributes[formData.type as keyof typeof CategoryAttributes].map((attr: string) => (
                      <View key={attr} style={styles.inputWrapper}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>{attr}</Text>
                        <TextInput
                          style={styles.input}
                          value={String((formData.details?.[attr]) || '')}
                          onChangeText={(value) => setFormData({
                            ...formData,
                            details: { ...formData.details, [attr]: value }
                          })}
                          placeholder={`Entrez ${attr.toLowerCase()}`}
                        />
                      </View>
                    ))}
                    
                  </View>
                )}

                {/* Real Estate Details */}
                {isRealEstate && (
                  <>
                    <Text style={[styles.subSectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A', marginTop: 20, marginBottom: 12 }]}>
                      Détails du bien
                    </Text>

                    <View style={styles.gridRow}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Chambres</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            },
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={String(formData.beds || '')}
                          onChangeText={(text) => setFormData({ ...formData, beds: parseInt(text) || 0 })}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Salles de bain</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            },
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={String(formData.baths || '')}
                          onChangeText={(text) => setFormData({ ...formData, baths: parseInt(text) || 0 })}
                        />
                      </View>
                    </View>

                    <View style={styles.gridRow}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Superficie (m²)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            },
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={String(formData.area || '')}
                          onChangeText={(text) => setFormData({ ...formData, area: parseInt(text) || 0 })}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Parking</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            },
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={String(formData.parking_spaces || '')}
                          onChangeText={(text) => setFormData({ ...formData, parking_spaces: parseInt(text) || 0 })}
                        />
                      </View>
                    </View>

                    <View style={styles.gridRow}>
                      <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Salon (m²)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            },
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={String(formData.living_area || '')}
                          onChangeText={(text) => setFormData({ ...formData, living_area: parseInt(text) || 0 })}
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Cuisine (m²)</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                              color: isDark ? '#F1F5F9' : '#0F172A',
                              borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                            },
                          ]}
                          placeholder="0"
                          keyboardType="numeric"
                          value={String(formData.kitchen_area || '')}
                          onChangeText={(text) => setFormData({ ...formData, kitchen_area: parseInt(text) || 0 })}
                        />
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}

            {/* STEP 4: Media */}
            {formStep === 4 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Médias
                </Text>

                {/* Tabs */}
                <View style={styles.mediaTabs}>
                  <TouchableOpacity
                    style={[styles.mediaTab, mediaTab === 'images' && { backgroundColor: '#06B6D4' }]}
                    onPress={() => setMediaTab('images')}
                  >
                    <MaterialCommunityIcons
                      name="image-multiple"
                      size={16}
                      color={mediaTab === 'images' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.mediaTabText,
                        { color: mediaTab === 'images' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Images ({(formData.images || []).length})
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.mediaTab, mediaTab === 'videos' && { backgroundColor: '#06B6D4' }]}
                    onPress={() => setMediaTab('videos')}
                  >
                    <MaterialCommunityIcons
                      name="filmstrip"
                      size={16}
                      color={mediaTab === 'videos' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.mediaTabText,
                        { color: mediaTab === 'videos' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' },
                      ]}
                    >
                      Vidéos ({(formData.videos || []).length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Upload Progress */}
                {uploadProgress && (
                  <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={[{ color: isDark ? '#06B6D4' : '#0E7490', fontSize: 12, fontWeight: '600' }]}>
                      {uploadProgress}
                    </Text>
                  </View>
                )}

                {/* Add Media Button */}
                <TouchableOpacity
                  style={[styles.addMediaBtn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, backgroundColor: uploading ? '#9CA3AF' : '#06B6D4' }]}
                  onPress={mediaTab === 'images' ? handlePickImage : handlePickVideo}
                  disabled={uploading}
                >
                  <MaterialCommunityIcons
                    name={mediaTab === 'images' ? 'camera-plus' : 'video-plus'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                    {uploading ? 'En cours...' : (mediaTab === 'images' ? 'Ajouter une image' : 'Ajouter une vidéo')}
                  </Text>
                </TouchableOpacity>

                {/* Media Preview */}
                {(mediaTab === 'images' ? (formData.images || []) : (formData.videos || [])).length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A', marginBottom: 12 }]}>
                      {mediaTab === 'images' ? 'Aperçu des images' : 'Aperçu des vidéos'}
                    </Text>

                    {mediaTab === 'images' ? (
                      <View style={styles.imageGallery}>
                        {(formData.images || []).map((url, idx) => (
                          <View key={idx} style={styles.thumbnailContainer}>
                            <Image source={{ uri: url }} style={styles.thumbnail} />
                            <TouchableOpacity
                              style={styles.removeThumbnailBtn}
                              onPress={() => handleRemoveMedia(url, 'images')}
                            >
                              <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                            {(url.startsWith('file://') || url.includes('Documents')) && (
                              <View style={styles.localBadge}>
                                <Text style={styles.localBadgeText}>Local</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.videoGallery}>
                        {(formData.videos || []).map((url, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={styles.videoThumbnailContainer}
                            onPress={() => handlePlayVideo(url)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.videoThumbnail, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                              <View style={styles.videoPlayIconContainer}>
                                <MaterialCommunityIcons name="play" size={28} color="#FF6B9D" />
                              </View>
                              <View style={styles.videoInfoOverlay}>
                                <Text style={styles.videoNumber}>Vidéo {idx + 1}</Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.removeVideoThumbnailBtn}
                              onPress={() => handleRemoveMedia(url, 'videos')}
                            >
                              <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                            {(url.startsWith('file://') || url.includes('Documents')) && (
                              <View style={[styles.localBadge, { backgroundColor: 'rgba(16, 185, 129, 0.9)' }]}>
                                <Text style={styles.localBadgeText}>Local</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={[styles.footerButtons, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderTopColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)', opacity: uploading ? 0.5 : 1 }]}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: isDark ? '#2D3E5F' : '#F1F5F9' }]}
              onPress={handlePrevStep}
              disabled={formStep === 1 || uploading}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={(formStep === 1 || uploading) ? (isDark ? '#475569' : '#CBD5E1') : isDark ? '#F1F5F9' : '#0F172A'}
              />
              <Text
                style={{
                  color: (formStep === 1 || uploading) ? (isDark ? '#475569' : '#CBD5E1') : isDark ? '#F1F5F9' : '#0F172A',
                  fontWeight: '600',
                }}
              >
                Précédent
              </Text>
            </TouchableOpacity>

            {formStep === 4 ? (
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: uploading ? '#9CA3AF' : '#10B981', flex: 1, marginLeft: 8 }]}
                onPress={handleSave}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', marginLeft: 8 }}>Upload...</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                      {editingId ? 'Modifier' : 'Créer'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: uploading ? '#9CA3AF' : '#06B6D4', flex: 1, marginLeft: 8 }]}
                onPress={handleNextStep}
                disabled={uploading}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Suivant</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Upload Progress Modal */}
      <Modal visible={uploadStatus !== 'idle'} transparent={true} animationType="fade">
        <View style={[styles.progressModalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
          <Animated.View
            style={[
              styles.progressModalContent,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {uploadStatus === 'uploading' && (
              <>
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text style={[styles.progressTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  {uploadMessage}
                </Text>
                <Text style={[styles.progressPercentage, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {uploadProgress}
                </Text>
                <View style={[styles.uploadProgressBar, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${parseInt(uploadProgress)}%` },
                    ]}
                  />
                </View>
              </>
            )}
            {uploadStatus === 'success' && (
              <>
                <View style={styles.successIcon}>
                  <MaterialCommunityIcons name="check-circle" size={80} color="#10B981" />
                </View>
                <Text style={[styles.successTitle, { color: '#10B981' }]}>
                  {uploadMessage}
                </Text>
                <Text style={[styles.successSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {editingId ? 'Vos modifications ont été sauvegardées' : 'Votre annonce a été créée'}
                </Text>
              </>
            )}
            {uploadStatus === 'error' && (
              <>
                <View style={styles.errorIcon}>
                  <MaterialCommunityIcons name="alert-circle" size={80} color="#EF4444" />
                </View>
                <Text style={[styles.errorTitle, { color: '#EF4444' }]}>
                  Erreur
                </Text>
                <Text style={[styles.errorSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {uploadMessage}
                </Text>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Media Lightbox Modal */}
      <Modal visible={lightboxVisible} transparent={true} animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
        <SafeAreaView style={[styles.lightboxContainer, { backgroundColor: '#000000' }]}>
          {/* Header avec Close et Counter */}
          <View style={styles.lightboxHeader}>
            <TouchableOpacity onPress={() => setLightboxVisible(false)}>
              <MaterialCommunityIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.lightboxCounter}>
              {currentMediaIndex + 1} / {allMedia.length}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Main Media Display - Centered */}
          <View style={styles.lightboxMainContainer}>
            {currentMedia && currentMediaType === 'image' ? (
              <View style={styles.lightboxMediaWrapper}>
                <Image
                  source={{ uri: currentMedia.url }}
                  style={styles.lightboxMediaImage}
                  resizeMode="contain"
                />
              </View>
            ) : currentMedia && currentMediaType === 'video' ? (
              <View style={styles.videoPlayerContainer}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: getVideoPlayerHTML(currentMedia.url) }}
                  style={styles.videoWebView}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsFullscreenVideo={true}
                />
              </View>
            ) : null}
          </View>

          {/* Thumbnails Gallery - Horizontal scroll */}
          {allMedia.length > 1 && (
            <View style={styles.lightboxThumbnailsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lightboxThumbnailsList}
              >
                {allMedia.map((media, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.lightboxThumbnail,
                      currentMediaIndex === index && { borderColor: '#06B6D4', borderWidth: 3 },
                      currentMediaIndex !== index && { borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 },
                    ]}
                    onPress={() => {
                      setCurrentMediaIndex(index);
                      setCurrentMediaType(allMedia[index].type);
                    }}
                  >
                    {media.type === 'image' ? (
                      <Image
                        source={{ uri: media.url }}
                        style={styles.lightboxThumbnailImage}
                      />
                    ) : (
                      <View style={[styles.lightboxThumbnailImage, { backgroundColor: 'rgba(99, 102, 241, 0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialCommunityIcons name="play-circle" size={24} color="#06B6D4" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Navigation Buttons - Bottom Controls */}
          <View style={styles.lightboxControlsBottom}>
            <TouchableOpacity
              style={[styles.lightboxNavBtnBottom, { backgroundColor: currentMediaIndex === 0 ? 'rgba(99, 102, 241, 0.3)' : '#06B6D4' }]}
              onPress={handlePrevMedia}
              disabled={currentMediaIndex === 0}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color="#FFFFFF"
              />
              <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: 4 }}>Précédent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.lightboxNavBtnBottom, { backgroundColor: currentMediaIndex === allMedia.length - 1 ? 'rgba(99, 102, 241, 0.3)' : '#06B6D4' }]}
              onPress={handleNextMedia}
              disabled={currentMediaIndex === allMedia.length - 1}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', marginRight: 4 }}>Suivant</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Category Filter Modal */}
      <Modal visible={showCategoryModal} transparent={true} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#F1F5F9' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              Catégorie
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryModalContent}>
            {/* All Categories Option */}
            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: !selectedCategory ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: !selectedCategory ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSelectedCategory(null);
                setCurrentPage(1);
                setShowCategoryModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="filter-remove"
                size={20}
                color={!selectedCategory ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: !selectedCategory ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                      fontWeight: !selectedCategory ? '700' : '600',
                    },
                  ]}
                >
                  Toutes les catégories
                </Text>
              </View>
            </TouchableOpacity>

            {/* Category Options */}
            {[...CATEGORIES, ...(typeof EXTRA_CATEGORIES !== 'undefined' ? EXTRA_CATEGORIES : [])].map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: selectedCategory === cat.value ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                    borderColor: selectedCategory === cat.value ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                  },
                ]}
                onPress={() => {
                  setSelectedCategory(cat.value);
                  setCurrentPage(1);
                  setShowCategoryModal(false);
                }}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={20}
                  color={selectedCategory === cat.value ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: selectedCategory === cat.value ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                      fontWeight: selectedCategory === cat.value ? '700' : '600',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
                {selectedCategory === cat.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Listing Type Filter Modal */}
      <Modal visible={showListingTypeModal} transparent={true} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
            <TouchableOpacity onPress={() => setShowListingTypeModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#F1F5F9' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              Type de listing
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryModalContent}>
            {/* All Types Option */}
            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: !selectedListingType ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: !selectedListingType ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSelectedListingType(null);
                setCurrentPage(1);
                setShowListingTypeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="filter-remove"
                size={20}
                color={!selectedListingType ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: !selectedListingType ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                      fontWeight: !selectedListingType ? '700' : '600',
                    },
                  ]}
                >
                  Tous les types
                </Text>
              </View>
            </TouchableOpacity>

            {/* Listing Type Options */}
            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: selectedListingType === 'sale' ? '#10B981' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: selectedListingType === 'sale' ? '#10B981' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSelectedListingType('sale');
                setCurrentPage(1);
                setShowListingTypeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="tag-multiple"
                size={20}
                color={selectedListingType === 'sale' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  {
                    color: selectedListingType === 'sale' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                    fontWeight: selectedListingType === 'sale' ? '700' : '600',
                  },
                ]}
              >
                Vente
              </Text>
              {selectedListingType === 'sale' && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: selectedListingType === 'rental' ? '#F59E0B' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: selectedListingType === 'rental' ? '#F59E0B' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSelectedListingType('rental');
                setCurrentPage(1);
                setShowListingTypeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="key"
                size={20}
                color={selectedListingType === 'rental' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  {
                    color: selectedListingType === 'rental' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                    fontWeight: selectedListingType === 'rental' ? '700' : '600',
                  },
                ]}
              >
                Location
              </Text>
              {selectedListingType === 'rental' && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent={true} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#F1F5F9' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              Trier par
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryModalContent}>
            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: sortBy === 'newest' ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: sortBy === 'newest' ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSortBy('newest');
                setCurrentPage(1);
                setShowSortModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={sortBy === 'newest' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  {
                    color: sortBy === 'newest' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                    fontWeight: sortBy === 'newest' ? '700' : '600',
                  },
                ]}
              >
                Les plus récentes
              </Text>
              {sortBy === 'newest' && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: sortBy === 'oldest' ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: sortBy === 'oldest' ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSortBy('oldest');
                setCurrentPage(1);
                setShowSortModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="history"
                size={20}
                color={sortBy === 'oldest' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  {
                    color: sortBy === 'oldest' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                    fontWeight: sortBy === 'oldest' ? '700' : '600',
                  },
                ]}
              >
                Les plus anciennes
              </Text>
              {sortBy === 'oldest' && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: sortBy === 'price-low' ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: sortBy === 'price-low' ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSortBy('price-low');
                setCurrentPage(1);
                setShowSortModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color={sortBy === 'price-low' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  {
                    color: sortBy === 'price-low' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                    fontWeight: sortBy === 'price-low' ? '700' : '600',
                  },
                ]}
              >
                Prix: Bas vers Haut
              </Text>
              {sortBy === 'price-low' && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryOption,
                {
                  backgroundColor: sortBy === 'price-high' ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                  borderColor: sortBy === 'price-high' ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                },
              ]}
              onPress={() => {
                setSortBy('price-high');
                setCurrentPage(1);
                setShowSortModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="trending-down"
                size={20}
                color={sortBy === 'price-high' ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  {
                    color: sortBy === 'price-high' ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                    fontWeight: sortBy === 'price-high' ? '700' : '600',
                  },
                ]}
              >
                Prix: Haut vers Bas
              </Text>
              {sortBy === 'price-high' && (
                <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Items Per Page Modal */}
      <Modal visible={showItemsPerPageModal} transparent={true} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
            <TouchableOpacity onPress={() => setShowItemsPerPageModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={isDark ? '#F1F5F9' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              Articles par page
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.categoryModalContent}>
            {[5, 10, 15, 20, 25, 50].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: itemsPerPage === num ? '#06B6D4' : isDark ? '#1A2332' : '#F1F5F9',
                    borderColor: itemsPerPage === num ? '#06B6D4' : isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                  },
                ]}
                onPress={() => {
                  setItemsPerPage(num);
                  setCurrentPage(1);
                  setShowItemsPerPageModal(false);
                }}
              >
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  size={20}
                  color={itemsPerPage === num ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  style={[
                    styles.categoryOptionText,
                    {
                      color: itemsPerPage === num ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
                      fontWeight: itemsPerPage === num ? '700' : '600',
                    },
                  ]}
                >
                  {num} articles par page
                </Text>
                {itemsPerPage === num && (
                  <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  // Header + Filter section compact redesign
  topSectionLimited: {
    maxHeight: '13%',
    minHeight: 80,
    width: '100%',
    fontWeight: '700',
  },
  activeFiltersSection: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 4,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeFiltersLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  activeFiltersList: {
    flexDirection: 'row',
  },
  activeFiltersContent: {
    gap: 4,
    paddingRight: 8,
  },
  activeFilterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    gap: 3,
  },
  activeFilterText: {
    fontSize: 10,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  addBtnEnhanced: {
    overflow: 'hidden',
    borderRadius: 13,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  addBtnGradient: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  filterBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
    gap: 12,
  },
  searchSection: {
    gap: 8,
  },
  filtersScrollRow: {
    flexDirection: 'row',
  },
  filterButtonsContainer: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    // paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#06B6D4',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    paddingTop: 4,
    paddingBottom: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  articlesGrid: {
    justifyContent: 'space-between',
  },
  paginationContainer: {
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    marginTop: 16,
  },
  paginationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationInfoLeft: {
    flex: 1,
  },
  paginationNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paginationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemsPerPageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  itemsPerPageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paginationBtn: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  paginationBtnDisabled: {
    opacity: 0.4,
  },
  paginationPages: {
    flexDirection: 'row',
    gap: 6,
  },
  pageBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  pageBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#06B6D4',
  },
  content: {
    padding: 12,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  articleCard: {
    borderRadius: 20,
    borderWidth: 1.3,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  mediaGallery: {
    position: 'relative',
    height: 160,
    backgroundColor: '#F1F5F9',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#E2E8F0',
  },
  mediaCountBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mediaCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  articleContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 0,
    gap: 0,
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
    lineHeight: 23,
    letterSpacing: -0.4,
  },
  articleLocation: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 3,
    fontWeight: '500',
  },
  articleMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '800',
  },
  articleActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
    backgroundColor: 'rgba(99, 102, 241, 0.04)',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  editBtn: {
    backgroundColor: '#06B6D4',
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
  },
  // Enhanced Article Card Styles
  imageContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  typeBadgeCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  listingBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  listingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  descriptionSnippet: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
    marginBottom: 0,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  additionalDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRowLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRowValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  realEstateDetailsSection: {
    marginTop: 0,
    marginBottom: 6,
  },
  detailsSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0,
    marginTop: 6,
    gap: 4,
  },
  specBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 7,
    borderRadius: 12,
    borderWidth: 1.2,
    gap: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  specBadgeMinimal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    gap: 4,
  },
  specValue: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  specValueMinimal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailsGridWrapper: {
    gap: 10,
  },
  detailsGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailCardItem: {
    width: '23%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    minWidth: 24,
  },
  detailCardContent: {
    flex: 1,
  },
  detailCardValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailCardLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 0,
  },
  additionalAreasSection: {
    gap: 8,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.1)',
  },
  areaDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 4,
  },
  areaDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  areaDetailContent: {
    flex: 1,
  },
  areaDetailLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  areaDetailValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 0,
  },
  modalContainer: {
    flex: 1,
    marginTop : 10,
    paddingTop : 25
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom : 20,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 2,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  categoryCard: {
    width: '31%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  categoryCardLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  categoryModalContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: 15,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginTop: 7,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
  },
  mediaTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  mediaTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  mediaTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addMediaBtn: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 12,
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  removeThumbnailBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  localBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  localBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  videoGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  videoThumbnailContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  videoPlayIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
  },
  videoInfoOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  videoNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeVideoThumbnailBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  // Lightbox Styles
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop  : 30
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  lightboxCounter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  lightboxMainContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxMediaWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  lightboxMediaImage: {
    width: '100%',
    height: '100%',
  },
  lightboxVideoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  lightboxNavBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lightboxNavBtnLeft: {
    left: 12,
  },
  lightboxNavBtnRight: {
    right: 12,
  },
  lightboxThumbnailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  lightboxThumbnailsList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  lightboxThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  lightboxThumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  lightboxControlsBottom: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  lightboxNavBtnBottom: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  // Upload Progress Modal Styles
  progressModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModalContent: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  uploadProgressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#06B6D4',
    borderRadius: 4,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  videoPlayerContainer: {
    width: width,
    height: width * 0.7, // Ratio 16:9 ou adapter selon besoin
    backgroundColor: '#000',
  },
  videoWebView: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  fullImage: {
    width: width,
    height: '100%',
  },
  dynamicAttributesContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.05)', // Léger fond teinté indigo
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  inputWrapper: {
    marginBottom: 15,
    marginTop: 10,
  },
});
