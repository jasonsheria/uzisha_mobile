import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const featuredCollections = [
  {
    title: 'Collection Luxe',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    description: 'Des pièces exclusives pour un style inimitable.'
  },
  {
    title: 'Été 2026',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    description: 'La nouvelle vague de la mode estivale.'
  }
];

const CollectionsBanner = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Collections en vedette</Text>
    <View style={styles.row}>
      {featuredCollections.map((col, idx) => (
        <View key={col.title} style={styles.card}>
          <Image source={{ uri: col.image }} style={styles.image} />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{col.title}</Text>
            <Text style={styles.cardDesc}>{col.description}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 12,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    flex: 1,
    height: width * 0.36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 0,
    backgroundColor: '#222',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
  },
  cardTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  cardDesc: {
    color: '#EEE',
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default CollectionsBanner;
