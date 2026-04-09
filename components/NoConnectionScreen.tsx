import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function NoConnectionScreen() {
  const handleRetry = () => {
    NetInfo.fetch().then(state => {
      if (state.isConnected) {
        // On laisse RootLayout détecter le changement et fermer l'écran
      }
    });
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pas de connexion Internet</Text>
      <Text style={styles.subtitle}>Veuillez vérifier votre connexion réseau et réessayer.</Text>
      <TouchableOpacity style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
