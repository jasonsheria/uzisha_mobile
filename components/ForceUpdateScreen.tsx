import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Linking from 'expo-linking';

import { MaterialIcons } from '@expo/vector-icons';

type Props = {
  message: string;
  obsoleteDate?: string | null;
};

export default function ForceUpdateScreen({ message, obsoleteDate }: Props) {
  const storeUrl = Platform.OS === 'android'
    ? 'https://play.google.com/store/apps/details?id=ton.package'
    : 'https://apps.apple.com/app/idTON_APP_ID';

  return (
    <View style={styles.container}>
      <MaterialIcons name="system-update" size={64} color="#06B6D4" style={{ marginBottom: 18 }} />
      <Text style={styles.title}>Mise à jour requise</Text>
      <Text style={styles.message}>{message}</Text>
      {obsoleteDate && (
        <Text style={styles.date}>
          Version obsolète depuis le : <Text style={{ fontWeight: 'bold' }}>{formatDate(obsoleteDate)}</Text>
        </Text>
      )}
      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(storeUrl)}>
        <Text style={styles.buttonText}>Mettre à jour</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0F172A',
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    marginHorizontal: 8,
  },
  date: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 28,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 38,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
