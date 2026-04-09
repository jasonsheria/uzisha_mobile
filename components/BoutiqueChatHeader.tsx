// components/BoutiqueChatHeader.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChatHeaderProps {
  user: { name: string; avatar: string; isOnline: boolean };
  isDark: boolean;
}

export const BoutiqueChatHeader = ({ user, isDark }: ChatHeaderProps) => (
  <View style={[styles.container, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
    <View style={styles.avatarWrapper}>
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      <View style={[styles.statusDot, { backgroundColor: user.isOnline ? '#10B981' : '#94A3B8' }]} />
    </View>
    <View style={styles.info}>
      <Text style={[styles.name, { color: isDark ? '#FFF' : '#0F172A' }]} numberOfLines={1}>
        {user.name}
      </Text>
      <Text style={styles.statusText}>
        {user.isOnline ? 'En ligne' : 'Hors ligne'}
      </Text>
    </View>
    <MaterialCommunityIcons name="dots-vertical" size={24} color={isDark ? "#94A3B8" : "#64748B"} />
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginHorizontal: 15, marginBottom: 15, elevation: 2 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 45, height: 45, borderRadius: 22 },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderColor: '#FFF' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '800', fontSize: 16 },
  statusText: { fontSize: 12, color: '#94A3B8' }
});