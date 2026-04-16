import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/components/useColorScheme';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotificationsScreen() {
  const { isConnected } = useNetwork();
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  const {
    notifications,
    unreadCount,
    removeNotification,
    removeAllNotifications,
    toggleNotificationRead,
    markAllAsRead,
  } = useNotifications();

  // Rafraîchit les notifications à la reconnexion
  

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const getBadgeConfig = (type: Notification['type']) => {
    switch (type) {
      case 'booking': return { icon: 'calendar-check', color: '#10B981', label: 'Réservation' };
      case 'message': return { icon: 'chat-processing', color: '#06B6D4', label: 'Message' };
      case 'review': return { icon: 'star-face', color: '#F59E0B', label: 'Avis' };
      case 'system': return { icon: 'shield-check', color: '#06B6D4', label: 'Système' };
      default: return { icon: 'bell', color: '#64748B', label: 'Info' };
    }
  };

  const toggleSelectNotification = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const deleteSelected = async () => {
    await Promise.all(selectedIds.map(id => removeNotification(id)));
    setSelectedIds([]);
    setSelectMode(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header Premium */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusDot, { backgroundColor: unreadCount > 0 ? '#06B6D4' : '#10B981' }]} />
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0 ? `${unreadCount} nouvelles` : 'À jour'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            {selectMode ? (
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => {setSelectMode(false); setSelectedIds([]);}}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => setSelectMode(true)}>
                <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={26} color={isDark ? '#F1F5F9' : '#0F172A'} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions Bar */}
        {!selectMode && notifications.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
            <TouchableOpacity style={styles.chip} onPress={markAllAsRead}>
              <MaterialCommunityIcons name="check-all" size={16} color="#06B6D4" />
              <Text style={styles.chipText}>Tout lire</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={removeAllNotifications}>
              <MaterialCommunityIcons name="trash-can-outline" size={16} color="#EF4444" />
              <Text style={[styles.chipText, { color: '#EF4444' }]}>Tout effacer</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {selectMode && selectedIds.length > 0 && (
          <TouchableOpacity style={styles.floatingDelete} onPress={deleteSelected}>
            <MaterialCommunityIcons name="trash-can" size={20} color="#FFF" />
            <Text style={styles.floatingDeleteText}>Supprimer ({selectedIds.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const config = getBadgeConfig(notification.type);
            const isSelected = selectedIds.includes(notification.id);
            const isRead = notification.is_read;

            return (
              <TouchableOpacity
                key={notification.id}
                activeOpacity={0.8}
                onPress={() => selectMode ? toggleSelectNotification(notification.id) : toggleNotificationRead(notification.id)}
                style={[
                  styles.card,
                  !isRead && styles.cardUnread,
                  isSelected && styles.cardSelected,
                  { borderLeftColor: config.color, borderLeftWidth: isRead ? 0 : 4 }
                ]}
              >
                {selectMode && (
                  <View style={[styles.checkbox, isSelected && { backgroundColor: '#06B6D4', borderColor: '#06B6D4' }]}>
                    {isSelected && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
                  </View>
                )}

                <View style={[styles.iconBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <MaterialCommunityIcons name={config.icon as any} size={22} color={config.color} />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTag, { color: config.color }]}>{config.label.toUpperCase()}</Text>
                    <Text style={styles.cardTime}>
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                    </Text>
                  </View>
                  
                  <Text style={[styles.cardTitle, { color: isDark ? '#F1F5F9' : '#0F172A', fontWeight: isRead ? '600' : '800' }]} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  
                  <Text style={[styles.cardText, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={2}>
                    {notification.body}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <MaterialCommunityIcons name="bell-sleep" size={60} color={isDark ? '#334155' : '#E2E8F0'} />
            </View>
            <Text style={styles.emptyTitle}>Silence radio</Text>
            <Text style={styles.emptyDesc}>Revenez plus tard pour voir vos nouvelles notifications.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
  },
  header: {
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    paddingHorizontal: 20,
    paddingBottom: 15,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1E293B' : '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: isDark ? '#F8FAFC' : '#0F172A',
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  actionIconBtn: {
    padding: 4,
  },
  cancelText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 16,
  },
  quickActions: {
    gap: 10,
    paddingVertical: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#E2E8F0',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#06B6D4',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardUnread: {
    backgroundColor: isDark ? '#262F45' : '#FFFFFF',
    ...Platform.select({
      ios: { shadowOpacity: 0.12, shadowRadius: 15 },
      android: { elevation: 6 },
    }),
  },
  cardSelected: {
    borderColor: '#06B6D4',
    borderWidth: 2,
    backgroundColor: isDark ? '#2D3748' : '#EEF2FF',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingDelete: {
    position: 'absolute',
    bottom: -10,
    right: 20,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 10,
  },
  floatingDeleteText: {
    color: '#FFF',
    fontWeight: '800',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: isDark ? '#F1F5F9' : '#0F172A',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
},
});