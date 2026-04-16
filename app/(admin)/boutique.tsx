import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Modal,
  FlatList,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { supabase } from '@/utils/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { pickImage, uploadShopAsset } from '@/utils/uploadService';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { BOUTIQUE, Property } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
const { width } = Dimensions.get('window');
import { DynamicIcon } from '@/components/DynamicIcon';

// Interface étendue pour inclure les types d'articles (tags)
interface BoutiqueExtended extends BOUTIQUE {
  category_tags?: string[];
}

export default function BoutiqueManagerScreen() {
  const { user } = useAuthContext();
  const colorScheme = useColorScheme();
  const {isDark, dynamicColor, theme} = useTheme();
  // --- ÉTATS PRINCIPAUX ---
  const [loading, setLoading] = useState(false);
  const [boutiques, setBoutiques] = useState<BoutiqueExtended[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ÉTATS MODALES ---
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [selectedBoutique, setSelectedBoutique] = useState<BoutiqueExtended | null>(null);

  // --- ÉTATS FORMULAIRE ---
  const [isUpdating, setIsUpdating] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    adresse: '',
    phone: '',
    province: '',
    ville: '',
    commune: '',
    image: '',
    logo: '',
    category_tags: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchBoutiques(), fetchUserProperties()]);
    } catch (err) {
      console.error("Erreur lors du chargement :", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoutiques = async () => {
    const { data, error } = await supabase
      .from('boutiques')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (data) setBoutiques(data as BoutiqueExtended[]);
    if (error) console.error(error);
  };

  const fetchUserProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user?.id);
    if (data) setMyProperties(data as Property[]);
    if (error) console.error(error);
  };

  // --- GESTION DES TAGS (TYPES D'ARTICLES) ---
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
  const ALL_CATEGORIES = [...MAIN_CATEGORIES, ...EXTRA_CATEGORIES];

  const addTag = (value: string) => {
    if (!form.category_tags.includes(value)) {
      setForm(prev => ({
        ...prev,
        category_tags: [...prev.category_tags, value]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({
      ...prev,
      category_tags: prev.category_tags.filter(t => t !== tagToRemove)
    }));
  };

  // --- ACTIONS CRUD ---
  const handleCreateBoutique = async () => {
    if (!form.name || !form.phone) {
      Alert.alert("Erreur", "Le nom et le numéro de téléphone sont obligatoires.");
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('boutiques').insert([{
        name: form.name,
        description: form.description,
        adresse: form.adresse,
        phone: form.phone,
        province: form.province,
        ville: form.ville,
        commune: form.commune,
        image: form.image,
        logo: form.logo,
        category_tags: form.category_tags,
        user_id: user?.id,
        localization: {}
      }]);
      if (error) throw error;
      Alert.alert("Félicitations", "Votre boutique a été créée !");
      setIsCreateModalVisible(false);
      fetchBoutiques();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateBoutique = async () => {
    if (!selectedBoutique) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('boutiques')
        .update({
          name: form.name,
          description: form.description,
          adresse: form.adresse,
          phone: form.phone,
          province: form.province,
          ville: form.ville,
          commune: form.commune,
          image: form.image,
          logo: form.logo,
          category_tags: form.category_tags
        })
        .eq('id', selectedBoutique.id);

      if (error) throw error;
      Alert.alert("Succès", "Informations mises à jour.");
      fetchBoutiques();
    } catch (e: any) {
      Alert.alert("Erreur", e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteBoutique = (id: string) => {
    Alert.alert("Suppression", "Voulez-vous vraiment supprimer cette boutique ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from('boutiques').delete().eq('id', id);
          if (!error) {
            setIsAdminModalVisible(false);
            fetchBoutiques();
          }
        }
      }
    ]);
  };

  const handlePickMedia = async (type: 'logo' | 'image') => {
    const uri = await pickImage();
    if (uri && user) {
      setLoading(true);
      try {
        const remoteUrl = await uploadShopAsset(uri, user.id, type);
        if (remoteUrl) {
          setForm(prev => ({ ...prev, [type]: remoteUrl }));
          if (selectedBoutique) {
            await supabase.from('boutiques')
              .update({ [type]: remoteUrl })
              .eq('id', selectedBoutique.id);
          }
        }
      } catch (err) {
        Alert.alert("Erreur", "Échec de l'envoi de l'image.");
      } finally {
        setLoading(false);
      }
    }
  };

  const linkArticleToBoutique = async (propertyId: string) => {
    if (!selectedBoutique) return;
    const { error } = await supabase
      .from('properties')
      .update({ boutique_id: selectedBoutique.id })
      .eq('id', propertyId);

    if (!error) {
      fetchUserProperties();
      setIsLinkModalVisible(false);
    }
  };

  const unlinkArticle = async (propertyId: string) => {
    const { error } = await supabase
      .from('properties')
      .update({ boutique_id: null })
      .eq('id', propertyId);

    if (!error) fetchUserProperties();
  };

  // --- FILTRAGE ---
  const filteredBoutiques = useMemo(() => {
    return boutiques.filter(b =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.ville && b.ville.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, boutiques]);

  const openAdmin = (boutique: BoutiqueExtended) => {
    setSelectedBoutique(boutique);
    setForm({
      name: boutique.name,
      description: boutique.description || '',
      adresse: boutique.adresse || '',
      phone: boutique.phone || '',
      province: boutique.province || '',
      ville: boutique.ville || '',
      commune: boutique.commune || '',
      image: boutique.image || '',
      logo: boutique.logo || '',
      category_tags: boutique.category_tags || []
    });
    setIsAdminModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#020617' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.welcomeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>Gestionnaire</Text>
            <Text style={[styles.mainTitle, { color: isDark ? '#FFF' : '#06B6D4' }]}>Mes Boutiques</Text>
          </View>
          <TouchableOpacity style={[styles.statsBtn, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
            <Feather name="pie-chart" size={22} color="#06B6D4" />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E293B' : '#FFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
          <Ionicons name="search-outline" size={20} color="#64748B" />
          <TextInput
            placeholder="Rechercher une boutique..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* LISTE DES BOUTIQUES */}
      {loading && boutiques.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#06B6D4" />
        </View>
      ) : (
        <FlatList
          data={filteredBoutiques}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 10 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ delay: index * 50 }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}
                onPress={() => openAdmin(item)}
              >
                <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400' }} style={styles.cardImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
                  <View style={styles.cardInfo}>
                    <Image source={{ uri: item.logo || 'https://via.placeholder.com/50' }} style={styles.cardLogo} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.cardCity}>{item.ville || 'RDC'}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <DynamicIcon name="store-plus-outline" size={80} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#1E293B' }]}>Aucune boutique</Text>
              <Text style={styles.emptyText}>Commencez par créer votre premier point de vente pour vendre vos articles.</Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setForm({ name: '', description: '', adresse: '', phone: '', province: '', ville: '', commune: '', image: '', logo: '', category_tags: [] });
          setSelectedBoutique(null);
          setIsCreateModalVisible(true);
        }}
      >
        <LinearGradient colors={['#06B6D4', '#06B6D4']} style={styles.fabGradient}>
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* MODALE ADMIN */}
      <Modal visible={isAdminModalVisible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAdminModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#06B6D4'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#06B6D4', fontWeight : 'bold' }]}>Configuration</Text>
            <TouchableOpacity onPress={() => handleDeleteBoutique(selectedBoutique!.id)} style={styles.deleteBtnTop}>
              <Feather name="trash-2" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.visualHeader}>
              <TouchableOpacity onPress={() => handlePickMedia('image')} style={styles.bannerContainer}>
                <Image source={{ uri: form.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' }} style={styles.bannerImg} />
                <View style={styles.cameraOverlay}><DynamicIcon name="camera-plus" size={28} /></View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handlePickMedia('logo')} style={[styles.logoCircle, { borderColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
                <Image source={{ uri: form.logo || 'https://via.placeholder.com/100' }} style={styles.logoImg} />
                <View style={styles.logoEditBadge}><Ionicons name="pencil" size={14} color="#FFF" /></View>
              </TouchableOpacity>
            </View>

            <View style={styles.adminBody}>
              <Text style={styles.sectionHeader}>Identité & Slogan</Text>
              <InputBox label="Nom Commercial" value={form.name} onChange={(t: string) => setForm({ ...form, name: t })} isDark={isDark} icon="storefront-outline" />
              <InputBox label="Description / Slogan" value={form.description} onChange={(t: string) => setForm({ ...form, description: t })} isDark={isDark} multiline icon="document-text-outline" />

              {/* GESTION DES TYPES D'ARTICLES */}
              <View style={styles.tagsWrapper}>
                <Text style={styles.sectionHeader}>Types d'articles fournis</Text>
                <View style={styles.tagInputContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {ALL_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[
                          styles.tagItem,
                          {
                            backgroundColor: form.category_tags.includes(cat.value)
                              ? (isDark ? '#06B6D4' : '#06B6D4')
                              : (isDark ? '#334155' : '#E0E7FF'),
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          },
                        ]}
                        onPress={() =>
                          form.category_tags.includes(cat.value)
                            ? removeTag(cat.value)
                            : addTag(cat.value)
                        }
                      >
                        <DynamicIcon name={cat.icon as any} size={16}  style={{ marginRight: 4 }} />
                        <Text style={{ color: form.category_tags.includes(cat.value) ? '#fff' : (isDark ? '#E2E8F0' : '#4338CA'), fontWeight: 'bold', fontSize: 13 }}>{cat.label}</Text>
                        {form.category_tags.includes(cat.value) && (
                          <Ionicons name="close-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Localisation & Contact</Text>
              <InputBox label="Numéro WhatsApp" value={form.phone} onChange={(t: string) => setForm({ ...form, phone: t })} isDark={isDark} icon="logo-whatsapp" keyboard="phone-pad" />
              <View style={styles.gridRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <InputBox label="Ville" value={form.ville} onChange={(t: string) => setForm({ ...form, ville: t })} isDark={isDark} icon="location-outline" />
                </View>
                <View style={{ flex: 1 }}>
                  <InputBox label="Province" value={form.province} onChange={(t: string) => setForm({ ...form, province: t })} isDark={isDark} icon="map-outline" />
                </View> 
              </View>

              <TouchableOpacity style={styles.mainSaveBtn} onPress={handleUpdateBoutique} disabled={isUpdating}>
                <LinearGradient colors={['#06B6D4', '#94A3B8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveGradient}>
                  {isUpdating ? <ActivityIndicator color="#FFF" /> : ( 
                    <>
                      <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />
                      <Text style={styles.mainSaveText}>Enregistrer la configuration</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* ARTICLES LIÉS */}
              <View style={styles.divider} />
              <View style={styles.articlesHeader}>
                <Text style={styles.sectionHeader}>Articles en rayon</Text>
                <Text style={styles.countBadge}>{myProperties.filter(p => p?.boutique_id === selectedBoutique?.id).length} items</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalProps}>
                {myProperties.filter(p => p?.boutique_id === selectedBoutique?.id).map(prop => (
                  <View key={prop.id} style={[styles.miniProp, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
                    <Image source={{ uri: prop.images[0] }} style={styles.miniPropImg} />
                    <Text style={[styles.miniPropTitle, { color: isDark ? '#FFF' : '#000' }]} numberOfLines={1}>{prop.title}</Text>
                    <TouchableOpacity style={styles.miniUnlink} onPress={() => unlinkArticle(prop.id)}>
                      <Ionicons name="link-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addPropAction} onPress={() => setIsLinkModalVisible(true)}>
                  <View style={[styles.addPropInner, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                    <Ionicons name="add" size={30} color="#06B6D4" />
                    <Text style={styles.addPropText}>Ajouter</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={{ height: 60 }} />
          </ScrollView>
        </SafeAreaView>

        {/* MODALE LIER UN ARTICLE */}
        <Modal visible={isLinkModalVisible} transparent animationType="slide">
          <View style={styles.linkOverlay}>
            <View style={[styles.linkContent, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
              <View style={styles.modalDrag} />
              <Text style={[styles.linkTitle, { color: isDark ? '#FFF' : '#000' }]}>Sélectionner un article</Text>
              <Text style={styles.linkSub}>Liez vos articles Libres à cette boutique.</Text>

              <FlatList
                data={myProperties.filter(p => !p?.boutique_id)}
                keyExtractor={item => item.id}
                style={{ maxHeight: 350 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.linkItem, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]} onPress={() => linkArticleToBoutique(item.id)}>
                    <Image source={{ uri: item.images[0] }} style={styles.linkItemImg} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.linkItemName, { color: isDark ? '#FFF' : '#1E293B' }]}>{item.title}</Text>
                      <Text style={styles.linkItemPrice}>{item.price} $</Text>
                    </View>
                    <Ionicons name="add-circle" size={26} color="#06B6D4" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyLink}>Aucun article disponible.</Text>}
              />

              <TouchableOpacity style={styles.closeLinkBtn} onPress={() => setIsLinkModalVisible(false)}>
                <Text style={styles.closeLinkText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* MODALE CRÉATION RAPIDE */}
      <Modal visible={isCreateModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={[styles.createCard, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
            <Text style={[styles.createTitle, { color: isDark ? '#FFF' : '#000' }]}>Ouvrir une Boutique</Text>
            <InputBox label="Nom de l'enseigne" value={form.name} onChange={(t: string) => setForm({ ...form, name: t })} isDark={isDark} icon="storefront-outline" />
            <InputBox label="Ville" value={form.ville} onChange={(t: string) => setForm({ ...form, ville: t })} isDark={isDark} icon="location-outline" />
            <InputBox label="Numéro de contact" value={form.phone} onChange={(t: string) => setForm({ ...form, phone: t })} isDark={isDark} icon="call-outline" keyboard="phone-pad" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateModalVisible(false)}>
                <Text style={{ color: '#94A3B8', fontWeight: '700' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateBoutique}>
                <LinearGradient colors={['#94A3B8', '#06B6D4']} style={styles.confirmGradient}>
                  <Text style={{ color: '#FFF', fontWeight: '800' }}>Lancer</Text>
                </LinearGradient> 
              </TouchableOpacity>
            </View>
          </MotiView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const InputBox = ({ label, value, onChange, isDark, icon, multiline = false, keyboard = "default" }: any) => (
  <View style={styles.inputWrapper}>
    <Text style={[styles.label, { color: isDark ? '#94A3B8' : '#64748B' }]}>{label}</Text>
    <View style={[styles.inputContainer, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', height: multiline ? 100 : 55, alignItems: multiline ? 'flex-start' : 'center' }]}>
      <Ionicons name={icon} size={20} color="#06B6D4" style={{ marginLeft: 15, marginTop: multiline ? 15 : 0 }} />
      <TextInput
        style={[styles.input, { color: isDark ? '#FFF' : '#1E293B', paddingTop: multiline ? 15 : 0 }]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboard}
        placeholderTextColor="#94A3B8"
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { paddingHorizontal: 20, paddingVertical: 15 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  mainTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statsBtn: { width: 45, height: 45, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 18, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600' },
  listContent: { padding: 12, paddingBottom: 100 },
  card: { width: (width / 2) - 18, height: 240, borderRadius: 28, margin: 6, overflow: 'hidden', elevation: 5 },
  cardImage: { width: '100%', height: '100%' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', justifyContent: 'flex-end', padding: 15 },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  cardLogo: { width: 38, height: 38, borderRadius: 12, marginRight: 8, borderWidth: 2, borderColor: '#FFF' },
  cardName: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  cardCity: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 45, elevation: 8 },
  fabGradient: { flex: 1, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 20 },
  emptyText: { color: '#94A3B8', marginTop: 10, textAlign: 'center', lineHeight: 20 },

  // MODAL STYLES
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, marginTop: 40 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(214, 224, 239, 0.38)',  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  deleteBtnTop: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalScroll: { flex: 1 },
  visualHeader: { height: 240, alignItems: 'center', paddingTop: 10 },
  bannerContainer: { width: width - 40, height: 180, borderRadius: 30, overflow: 'hidden' },
  bannerImg: { width: '100%', height: '100%' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  logoCircle: { position: 'absolute', bottom: 0, width: 110, height: 110, borderRadius: 40, borderWidth: 6, elevation: 10, overflow: 'hidden', backgroundColor: '#FFF' },
  logoImg: { width: '100%', height: '100%' },
  logoEditBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#06B6D4', width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  adminBody: { padding: 25 },
  sectionHeader: { fontSize: 12, fontWeight: '900', color: '#06B6D4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  gridRow: { flexDirection: 'row' },

  // TAGS
  tagsWrapper: { marginBottom: 20 },
  tagInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tagInput: { flex: 1, height: 45, borderRadius: 12, paddingHorizontal: 15, fontSize: 14, fontWeight: '600' },
  addTagBtn: { marginLeft: 8 },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tagText: { fontWeight: '700', fontSize: 12 },

  mainSaveBtn: { height: 60, borderRadius: 18, overflow: 'hidden', marginTop: 20 },
  saveGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  mainSaveText: { color: '#FFF', fontWeight: '800', fontSize: 16, marginLeft: 10 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 30 },
  articlesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  countBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, fontWeight: '700', color: '#06B6D4' },
  horizontalProps: { paddingLeft: 0 },
  miniProp: { width: 140, borderRadius: 22, padding: 8, marginRight: 15, elevation: 3 },
  miniPropImg: { width: '100%', height: 90, borderRadius: 15, marginBottom: 8 },
  miniPropTitle: { fontSize: 13, fontWeight: '700' },
  miniUnlink: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,255,255,0.9)', padding: 5, borderRadius: 8 },
  addPropAction: { width: 100, height: 135 },
  addPropInner: { flex: 1, borderRadius: 22, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  addPropText: { fontSize: 12, color: '#06B6D4', fontWeight: '800', marginTop: 5 },
  // MODALE LINK
  linkOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  linkContent: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, minHeight: 500 },
  modalDrag: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 },
  linkTitle: { fontSize: 22, fontWeight: '900' },
  linkSub: { color: '#64748B', marginBottom: 20, fontWeight: '500' },
  linkItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, marginBottom: 10 },
  linkItemImg: { width: 60, height: 60, borderRadius: 14 },
  linkItemName: { fontSize: 15, fontWeight: '700' },
  linkItemPrice: { color: '#06B6D4', fontWeight: '800', marginTop: 2 },
  emptyLink: { textAlign: 'center', color: '#94A3B8', marginTop: 30, fontWeight: '600' },
  closeLinkBtn: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  closeLinkText: { fontWeight: '800', color: '#64748B' },
  // CREATE MODAL
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  createCard: { width: width * 0.9, padding: 25, borderRadius: 30, elevation: 20 },
  createTitle: { fontSize: 22, fontWeight: '900', marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, alignItems: 'center' },
  cancelBtn: { paddingHorizontal: 20 },
  confirmBtn: { width: 120, height: 50, borderRadius: 15, overflow: 'hidden' },
  confirmGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputWrapper: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', borderRadius: 16 },
  input: { flex: 1, paddingHorizontal: 15, fontSize: 16, fontWeight: '600' }
});