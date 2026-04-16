import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Platform,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from '@/components/useColorScheme';
import { useNetwork } from '@/contexts/NetworkContext';
import Colors from '@/constants/Colors';
// importer le height
const { height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = height * 0.55;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
// const {isDark, dynamicColor, theme} = useTheme();

// --- TYPES ---

// --- COMPOSANTS INTERNES ---


// --- TYPES ---
interface Conversation {
  id: string;
  otherPersonId: string;
  agentName: string;
  agentAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  isUnread: boolean;
  timestamp: string;
  isOnline?: boolean;
}

export default function MessagingListScreen() {
  const { isConnected } = useNetwork();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const styles = getStyles(isDark);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  const isMounted = React.useRef(true);
  const SkeletonPulse = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    return <Animated.View style={[styles.skeleton, { opacity }]} />;
  };
  const fetchConversations = useCallback(async (currentUserId: string) => {
    try {
      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_id.eq.${currentUserId},agent_id.eq.${currentUserId}`)
        .order('last_message_time', { ascending: false });

      if (convosError) throw convosError;
      if (!convos) return;

      const formattedData: Conversation[] = await Promise.all(
        convos.map(async (c) => {
          const { data: lastMsgArr } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMsg = lastMsgArr?.[0] || null;
          const targetId = c.user_id === currentUserId ? c.agent_id : c.user_id;

          const { data: otherUser } = await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', targetId)
            .single();

          return {
            id: c.id,
            otherPersonId: targetId,
            agentName: otherUser?.name || 'Utilisateur',
            agentAvatar: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetId}`,
            lastMessage: lastMsg ? lastMsg.text : 'Nouvelle conversation',
            lastMessageTime: lastMsg ? formatTime(lastMsg.created_at) : '',
            isUnread: lastMsg ? (lastMsg.read_at === null && lastMsg.user_id !== currentUserId) : false,
            timestamp: lastMsg ? lastMsg.created_at : c.last_message_time,
            isOnline: Math.random() > 0.8,
          };
        })
      );

      if (isMounted.current) setConversations(formattedData);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserId(session.user.id);
        fetchConversations(session.user.id);
      } else {
        router.navigate('/(auth)/login' as any);
      }
    });
    return () => { isMounted.current = false; };
  }, [fetchConversations]);

  // Rafraîchit les conversations à la reconnexion
  useEffect(() => {
    if (isConnected && userId) {
      fetchConversations(userId);
    }
  }, [isConnected]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchesSearch = c.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || (filter === 'unread' && c.isUnread);
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filter]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };
  // --- RENDU DES MESSAGES ---
  if (!userId) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? Colors.black : Colors.white }]}>
        <View style={{ height: HEADER_MAX_HEIGHT }}>
          <SkeletonPulse />
        </View>
        <View style={{ padding: 20 }}>
          <SkeletonPulse />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <View style={{ flex: 1, height: 50 }}><SkeletonPulse /></View>
            <View style={{ flex: 1, height: 50 }}><SkeletonPulse /></View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 40 }}>
            {[1, 2, 3, 4].map(i => <View key={i} style={{ width: '47%', height: 200 }}><SkeletonPulse /></View>)}
          </View>
        </View>
      </View>
    );
  }
  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/messaging/[agentId]', params: { agentId: item.otherPersonId } } as any)}
      activeOpacity={0.6}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.agentAvatar }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.content}>
        <View style={styles.cardHeader}>
          <Text style={[styles.name, item.isUnread && styles.unreadText]} numberOfLines={1}>
            {item.agentName}
          </Text>
          <Text style={[styles.time, item.isUnread && styles.unreadTime]}>{item.lastMessageTime}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.lastMsg, item.isUnread && styles.unreadMsg]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.isUnread && <View style={styles.unreadIndicator} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER ÉPURÉ */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="plus" size={26} color="#06B6D4" />
        </TouchableOpacity>
      </View>

      {/* RECHERCHE MINIMALISTE */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Rechercher..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* FILTRES CHIC */}
      <View style={styles.filterContainer}>
        <TouchableOpacity onPress={() => setFilter('all')} style={[styles.chip, filter === 'all' && styles.chipActive]}>
          <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>Toutes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('unread')} style={[styles.chip, filter === 'unread' && styles.chipActive]}>
          <Text style={[styles.chipText, filter === 'unread' && styles.chipTextActive]}>Non lues</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#06B6D4" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchConversations(userId!)} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucune discussion trouvée</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000000' : '#FFFFFF',
  },
   skeleton: { backgroundColor: '#333', borderRadius: 12, flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : '#111827',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#111827' : '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: isDark ? '#FFFFFF' : '#111827',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: isDark ? '#FFFFFF' : '#111827',
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2.5,
    borderColor: isDark ? '#000000' : '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: isDark ? '#E5E7EB' : '#111827',
    flex: 1,
  },
  unreadText: {
    fontWeight: '800',
    color: isDark ? '#FFFFFF' : '#000000',
  },
  time: {
    fontSize: 13,
    color: '#94A3B8',
  },
  unreadTime: {
    color: '#06B6D4',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsg: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  unreadMsg: {
    color: isDark ? '#D1D5DB' : '#374151',
    fontWeight: '600',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06B6D4',
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: isDark ? '#111827' : '#F3F4F6',
    marginLeft: 72,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
  },
});