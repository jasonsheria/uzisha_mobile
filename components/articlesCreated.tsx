import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { 
  Camera, 
  Video, 
  MapPin, 
  Tag, 
  X, 
  Plus, 
  LayoutGrid,
  Info,
  ArrowRight,
  ChevronRight,
  Home,
  Warehouse,
  Map,
  Store
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- TYPES & CONFIGURATION ---

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  uri: string;
}

const COLORS = {
  primary: '#06B6D4',
  secondary: '#0891B2',
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: 'rgba(241, 245, 249, 0.1)',
  accent: '#A855F7',
};

// --- COMPOSANTS AUXILIAIRES ---

const InputField = ({ label, icon: Icon, placeholder, value, onChangeText, multiline = false, keyboardType = 'default' }: any) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelRow}>
      {Icon && <Icon size={16} color={COLORS.primary} strokeWidth={2.5} />}
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <TextInput
      style={[styles.input, multiline && styles.inputMultiline]}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      selectionColor={COLORS.primary}
    />
  </View>
);

const MediaPreview = ({ item, onRemove }: { item: MediaItem; onRemove: (id: string) => void }) => (
  <View style={styles.mediaBox}>
    <Image source={{ uri: item.uri }} style={styles.mediaImage} />
    {item.type === 'video' && (
      <View style={styles.videoBadge}>
        <Video size={12} color="white" fill="white" />
      </View>
    )}
    <TouchableOpacity style={styles.removeMediaBtn} onPress={() => onRemove(item.id)}>
      <X size={12} color="white" />
    </TouchableOpacity>
  </View>
);

// --- COMPOSANT PRINCIPAL ---

export default function App() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    media: [] as MediaItem[]
  });

  const addMedia = (type: 'image' | 'video') => {
    if (form.media.length >= 10) {
      Alert.alert("Limite atteinte", "Maximum 10 photos/vidéos.");
      return;
    }

    const newMedia: MediaItem = {
      id: Math.random().toString(36).substring(7),
      type,
      uri: type === 'video' 
        ? 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800' 
        : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
    };

    setForm(prev => ({ ...prev, media: [...prev.media, newMedia] }));
  };

  const removeMedia = (id: string) => {
    setForm(prev => ({ ...prev, media: prev.media.filter(m => m.id !== id) }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <X color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Annonce</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PROGRESSION */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Étape 1 sur 3 : Détails de base</Text>
          </View>

          {/* MÉDIAS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photos & Vidéos</Text>
              <Text style={styles.sectionSubtitle}>{form.media.length}/10</Text>
            </View>
            
            <View style={styles.mediaGrid}>
              {form.media.map((item) => (
                <MediaPreview key={item.id} item={item} onRemove={removeMedia} />
              ))}
              
              {form.media.length < 10 && (
                <View style={styles.mediaButtonsRow}>
                  <TouchableOpacity style={styles.addMediaBtn} onPress={() => addMedia('image')}>
                    <Camera size={24} color={COLORS.primary} />
                    <Text style={styles.addMediaText}>PHOTO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.addMediaBtn, { borderColor: COLORS.accent }]} onPress={() => addMedia('video')}>
                    <Video size={24} color={COLORS.accent} />
                    <Text style={[styles.addMediaText, { color: COLORS.accent }]}>VIDÉO</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* FORMULAIRE */}
          <View style={styles.section}>
            <InputField 
              label="Titre de l'annonce" 
              icon={Tag} 
              placeholder="Ex: Villa moderne à Kyeshero" 
              value={form.title}
              onChangeText={(t: string) => setForm({...form, title: t})}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField 
                  label="Prix (USD)" 
                  icon={LayoutGrid} 
                  placeholder="0.00" 
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(t: string) => setForm({...form, price: t})}
                />
              </View>
              <View style={{ width: 15 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelStatic}>Type d'offre</Text>
                <TouchableOpacity style={styles.selector}>
                  <Text style={styles.selectorText}>Location</Text>
                  <ChevronRight size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <InputField 
              label="Description" 
              icon={Info} 
              placeholder="Détails importants (eau, électricité...)" 
              multiline={true}
              value={form.description}
              onChangeText={(t: string) => setForm({...form, description: t})}
            />

            <InputField 
              label="Localisation" 
              icon={MapPin} 
              placeholder="Quartier, Avenue, Référence" 
              value={form.address}
              onChangeText={(t: string) => setForm({...form, address: t})}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER FIXED */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Brouillon</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.btnPrimary} 
          onPress={() => Alert.alert("Uzisha", "Publication lancée !")}
        >
          <Text style={styles.btnPrimaryText}>PUBLIER</Text>
          <ArrowRight size={20} color={COLORS.background} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 20 },
  progressContainer: { marginBottom: 30 },
  progressBarBg: { height: 6, backgroundColor: COLORS.card, borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  sectionSubtitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', backgroundColor: COLORS.card, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mediaBox: { width: (width - 60) / 3, height: (width - 60) / 3, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.card },
  mediaImage: { width: '100%', height: '100%' },
  removeMediaBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 8 },
  videoBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: COLORS.accent, padding: 4, borderRadius: 4 },
  mediaButtonsRow: { flexDirection: 'row', width: '100%', gap: 10, marginTop: 5 },
  addMediaBtn: { flex: 1, height: 70, borderRadius: 15, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6, 182, 212, 0.05)' },
  addMediaText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  inputContainer: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginLeft: 6, textTransform: 'uppercase' },
  inputLabelStatic: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 15, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', marginBottom: 5 },
  selector: { backgroundColor: COLORS.card, borderRadius: 12, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  selectorText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: COLORS.background, padding: 20, 
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border 
  },
  btnPrimary: { flex: 2, backgroundColor: COLORS.primary, height: 55, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnPrimaryText: { color: COLORS.background, fontSize: 16, fontWeight: '900' },
  btnSecondary: { flex: 1, backgroundColor: COLORS.card, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  btnSecondaryText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
});