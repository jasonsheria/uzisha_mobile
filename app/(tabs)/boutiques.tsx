import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { supabase } from '@/utils/supabase';

interface Boutique {
  id: string;
  name: string;
  description: string;
  image: string;
  Territoire?: string;
  Ville?: string;
  province?: string;
  userId?: string;
}

export default function BoutiquesScreen() {
  const isDark = useColorScheme() === 'dark';
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBoutiques = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('boutiques')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setBoutiques(data);
      setLoading(false);
    };
    loadBoutiques();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}> 
      <Text style={[styles.header, { color: isDark ? '#F1F5F9' : '#1E293B' }]}>Boutiques Virtuelles</Text>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Chargement...</Text>
      ) : (
        <FlatList
          data={boutiques}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}
              onPress={() => { /* navigation vers la boutique */ }}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#1E293B' }]} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.meta}>{item.Ville} {item.Territoire} {item.province}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: 'bold', margin: 20, marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  image: { width: 70, height: 70, borderRadius: 12, marginRight: 14, backgroundColor: '#E5E7EB' },
  title: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#64748B', marginTop: 2 },
  meta: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
});
