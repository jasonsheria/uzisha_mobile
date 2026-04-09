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
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  MaterialCommunityIcons, 
  Ionicons, 
  Feather, 
  FontAwesome6 
} from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

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

// --- ANIMATION COMPONENTS ---



const SkeletonPulse = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.skeleton, { opacity }]} />;
};

// --- MAIN SCREEN ---
const ConversationItem = React.memo(({ 
  item, 
  index, 
  isDark, 
  onPress 
}: { 
  item: Conversation; 
  index: number; 
  isDark: boolean; 
  onPress: () => void 
}) => {
  // Les hooks sont autorisés ici car c'est un vrai composant fonctionnel
  const slideIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideIn, {
      toValue: 1,
      duration: 400,
      delay: Math.min(index * 50, 600), // Cap pour éviter des délais infinis
      useNativeDriver: true,
    }).start();
  }, []);

  const opacity = slideIn.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const translateY = slideIn.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0]
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={[styles.convoCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FFF' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: item.agentAvatar }} style={styles.mainAvatar} />
          {item.isOnline && (
            <View style={styles.statusBadge}>
              <View style={styles.onlineInner} />
            </View>
          )}
          {item.isUnread && <View style={styles.unreadGlow} />}
        </View>

        <View style={styles.convoInfo}>
          <View style={styles.convoHeader}>
            <Text style={[styles.agentName, { color: isDark ? '#F1F5F9' : '#0F172A' }]} numberOfLines={1}>
              {item.agentName}
            </Text>
            <Text style={[styles.timestamp, { color: item.isUnread ? '#06B6D4' : '#94A3B8' }]}>
              {item.lastMessageTime}
            </Text>
          </View>

          <View style={styles.convoFooter}>
            <Text 
              style={[
                  styles.messagePreview, 
                  { color: item.isUnread ? (isDark ? '#FFF' : '#000') : '#64748B' },
                  item.isUnread && styles.boldText
              ]} 
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {item.isUnread && (
              <LinearGradient
                colors={['#06B6D4', '#3B82F6']}
                style={styles.unreadBadge}
              >
                <Text style={styles.unreadCount}>1</Text>
              </LinearGradient>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
export default function MessagingListScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  // Animations Scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);
const FloatingParticle = ({ delay, startX }: { delay: number; startX: number }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(moveAnim, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, -100],
  });

  const opacity = moveAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.3, 0.3, 0],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          opacity: opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
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
            agentName: otherUser?.name || 'Client',
            agentAvatar: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetId}`,
            lastMessage: lastMsg ? lastMsg.text : 'Début de la session',
            lastMessageTime: lastMsg ? formatTime(lastMsg.created_at) : '',
            isUnread: lastMsg ? (lastMsg.read_at === null && lastMsg.user_id !== currentUserId) : false,
            timestamp: lastMsg ? lastMsg.created_at : c.last_message_time,
            isOnline: Math.random() > 0.7,
          };
        })
      );

      if (isMounted.current) setConversations(formattedData);
    } catch (err) {
      console.error("Fetch Error:", err);
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
  }, []);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchesSearch = c.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || (filter === 'unread' && c.isUnread);
      return matchesSearch && matchesFilter;
    });
  }, [conversations, searchQuery, filter]);

  // --- RENDERING ---

  const renderHeader = () => {
    const headerTranslateY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -20],
      extrapolate: 'clamp',
    });

    const headerOpacity = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? '#64748B' : '#94A3B8' }]}>CONCIERGE</Text>
            <Text style={[styles.mainTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>Échanges</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileCircle}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <LinearGradient
              colors={['#06B6D4', '#3B82F6']}
              style={styles.gradientCircle}
            >
              <Feather name="edit-3" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchSection, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <Feather name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Rechercher une discussion..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => { setFilter('all'); Haptics.selectionAsync(); }}
            style={[styles.tab, filter === 'all' && styles.activeTab]}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.activeTabText]}>Tout</Text>
            {filter === 'all' && <Animated.View style={styles.activeIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => { setFilter('unread'); Haptics.selectionAsync(); }}
            style={[styles.tab, filter === 'unread' && styles.activeTab]}
          >
            <View style={styles.row}>
                <Text style={[styles.tabText, filter === 'unread' && styles.activeTabText]}>Non lus</Text>
                {conversations.some(c => c.isUnread) && <View style={styles.unreadDotSmall} />}
            </View>
            {filter === 'unread' && <Animated.View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

 const renderConversation = useCallback(({ item, index }: { item: Conversation; index: number }) => (
    <ConversationItem 
      item={item} 
      index={index} 
      isDark={isDark} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({ pathname: '/messaging/[agentId]', params: { agentId: item.otherPersonId } } as any);
      }} 
    />
  ), [isDark]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Feather name="message-square" size={40} color="#94A3B8" />
      </View>
      <Text style={[styles.emptyTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>Silence radio</Text>
      <Text style={styles.emptySubtitle}>Aucune conversation ne correspond à vos critères.</Text>
      <TouchableOpacity style={styles.startBtn}>
        <Text style={styles.startBtnText}>Démarrer un chat</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <View style={styles.skeletonHeader}>
                <SkeletonPulse />
                <View style={{height: 50, marginTop: 20}}><SkeletonPulse /></View>
            </View>
            <View style={{padding: 20}}>
                {[1,2,3,4,5].map(i => (
                    <View key={i} style={styles.skeletonCard}><SkeletonPulse /></View>
                ))}
            </View>
        </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Background Particles */}
      <View style={StyleSheet.absoluteFill}>
        <FloatingParticle delay={0} startX={width * 0.1} />
        <FloatingParticle delay={2000} startX={width * 0.5} />
        <FloatingParticle delay={4500} startX={width * 0.8} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {renderHeader()}

        <Animated.FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => { setRefreshing(true); fetchConversations(userId!); }}
                tintColor="#06B6D4"
            />
          }
        />
      </SafeAreaView>

     
    </View>
  );
}

// --- STYLES EXTRÊMES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#06B6D4',
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  profileCircle: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 25,
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#06B6D4',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#06B6D4',
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06B6D4',
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 100,
  },
  convoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  mainAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  unreadGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#06B6D4',
    opacity: 0.5,
  },
  convoInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  agentName: {
    fontSize: 17,
    fontWeight: '700',
    maxWidth: '70%',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '600',
  },
  convoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    maxWidth: '85%',
  },
  boldText: {
    fontWeight: '700',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.1,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  startBtn: {
    marginTop: 25,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  startBtnText: {
    color: '#FFF',
    fontWeight: '700',
  },
  skeletonHeader: {
    padding: 24,
  },
  skeletonCard: {
    height: 90,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  skeleton: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 25,
  },
  fabShadow: {
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  activeTab:{
    borderBottomWidth: 3,
    paddingBottom: 5,
  }
});