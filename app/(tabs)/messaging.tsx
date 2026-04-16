import { useNetwork } from '@/contexts/NetworkContext';
const statut = require('@/assets/images/third.jpg');
// --- FAKE DATA STORIES ---
const fakeStories = [
  { id: '1', name: 'Alex', avatar: statut, isOnline: true },

];
// --- UTILITAIRE POUR FORMATER LES DATES ---
const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
};
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
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
  Ionicons,
  Feather,
  FontAwesome6,
} from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// --- CONFIGURATION & CONSTANTES ---
const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
import Errorpage from '../messaging/error';
// --- TYPES DÉTAILLÉS ---

interface Conversation {
  id: string;
  otherPersonId: string;
  agentName: string;
  agentAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  isUnread: boolean;
  timestamp: string;
  isOnline: boolean;
  typing?: boolean;
  category?: 'primary' | 'general' | 'request';
}

// --- COMPOSANTS ATOMIQUES D'UI (UTILS) ---

/**
 * Composant de pulsation pour le chargement (Skeleton)
 */
const SkeletonElement = ({ style }: { style: any }) => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[style, { opacity: pulseAnim, backgroundColor: '#cbd5e1' }]} />;
};

/**
 * Badge de statut en ligne avec effet de halo
 */
const OnlineBadge = ({ size = 14 }: { size?: number }) => (
  <View style={[styles.onlineBadgeContainer, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
    <View style={[styles.onlineBadgeInner, { width: size, height: size, borderRadius: size / 2 }]} />
  </View>
);

/**
 * Particules de fond animées pour le "Eye Candy"
 */
const BackgroundDecorator = ({ isDark }: { isDark: boolean }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, { top: -50, right: -50, backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />
      <View style={[styles.blob, { bottom: 100, left: -80, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]} />
    </View>
  );
};


const ConversationRow = React.memo(({
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        delay: index * 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.convoRow,
          { backgroundColor: pressed ? (isDark ? '#1e293b' : '#f1f5f96e') : 'transparent' }
        ]}
      >
        <View style={styles.convoLeft}>
          <View style={styles.mainAvatarContainer}>
            <Image source={{ uri: item.agentAvatar }} style={styles.rowAvatar} />
            {item.isOnline && <OnlineBadge size={12} />}
          </View>
        </View>

        <View style={styles.convoCenter}>
          <View style={styles.convoTopRow}>
            <Text style={[styles.rowName, { color: isDark ? '#f8fafc' : '#ffffffd2' }]} numberOfLines={1}>
              {item.agentName}
            </Text>
            <Text style={[styles.rowTime, { color: item.isUnread ? '#06B6D4' : '#94a3b8' }]}>
              {item.lastMessageTime}
            </Text>
          </View>

          <View style={styles.convoBottomRow}>
            <Text
              style={[
                styles.rowMessage,
                { color: item.isUnread ? (isDark ? '#f1f5f9' : '#f5f5f5a5') : '#64748b' },
                item.isUnread && styles.rowMessageUnread
              ]}
              numberOfLines={1}
            >
              {item.typing ? (
                <Text style={{ color: '#06B6D4', fontStyle: 'italic' }}>En train d'écrire...</Text>
              ) : item.lastMessage}
            </Text>

            {item.isUnread && (
              <View style={styles.unreadIndicator}>
                <LinearGradient colors={['#06B6D4', '#3B82F6']} style={styles.unreadDot} />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// --- ÉCRAN PRINCIPAL ---

export default function MessagingListScreen() {
  const { isConnected } = useNetwork();
  // Rafraîchit les conversations à la reconnexion



  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [owners, setOwners] = useState<any[]>([]);
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  // Animation Refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchBarTranslate = useRef(new Animated.Value(0)).current;

  // Fix ReferenceError: isMounted
  const isMounted = useRef(true);
  useEffect(() => {
    if (isConnected && userId) {
      fetchConversations(userId);
    } else {
      <Errorpage />

    }
  }, [isConnected]);
  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {

      if (session) {

        setUserId(session.user.id);

        fetchConversations(session.user.id);

      }

    });

  }, []);
 
  const fetchConversations = useCallback(async (currentUserId: string) => {
    try {
      setLoading(true);
      // Récupérer les conversations où l'utilisateur est user_id ou agent_id
      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_id.eq.${currentUserId},agent_id.eq.${currentUserId}`)
        .order('last_message_time', { ascending: false });

      if (convosError) throw convosError;
      if (!convos) return;

      const formattedData: Conversation[] = await Promise.all(
        convos.map(async (c) => {
          // Récupérer le dernier message de la conversation
          const { data: lastMsgArr } = await supabase
            .from('messages')
            .select('id, text, created_at, read_at, user_id')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMsg = lastMsgArr?.[0] || null;
          const targetId = c.user_id === currentUserId ? c.agent_id : c.user_id;

          // Récupérer les infos de l'autre utilisateur
          const { data: otherUser } = await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', targetId)
            .single();

          // Déterminer si la conversation est non lue pour l'utilisateur courant
          let isUnread = false;
          if (lastMsg) {
            // Si le dernier message n'est pas lu et qu'il n'a pas été envoyé par l'utilisateur courant
            isUnread = lastMsg.read_at === null && lastMsg.user_id !== currentUserId;
          }

          return {
            id: c.id,
            otherPersonId: targetId,
            agentName: otherUser?.name || 'Client',
            agentAvatar: otherUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetId}`,
            lastMessage: lastMsg ? lastMsg.text : 'Début de la session',
            lastMessageTime: lastMsg ? formatTime(lastMsg.created_at) : '',
            isUnread,
            timestamp: lastMsg ? lastMsg.created_at : c.last_message_time,
            isOnline: false, // Fake pour l'instant
          };
        })
      );

      if (isMounted.current) setConversations(formattedData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  // --- LOGIQUE DE FILTRAGE ---
  const filteredData = useMemo(() => {
    let base = conversations.filter(c =>
      c.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'unread') return base.filter(c => c.isUnread);
    return base;
  }, [conversations, searchQuery, activeTab]);

  // --- RENDU DES SECTIONS ---

  const renderHeader = () => {
    const titleScale = scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 0.8],
      extrapolate: 'clamp'
    });

    const headerTranslate = scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -20],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslate }] }]}>
        <View style={styles.headerTop}>
          <Animated.Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#fefeff', transform: [{ scale: titleScale }] }]}>
            Discussions
          </Animated.Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Feather name="camera" size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
            >
              <FontAwesome6 name="pen-to-square" size={18} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Rechercher des messages..."
            placeholderTextColor="#11367f85"
            style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stories / Active Users */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={fakeStories}
          keyExtractor={(item) => `story-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.activeUserContainer}>
              <View style={styles.activeAvatarWrapper}>
                <LinearGradient
                  colors={['#06B6D4', '#3B82F6', '#8B5CF6']}
                  style={styles.storyGradient}
                >
                  <Image source={item.avatar} style={styles.activeAvatar} />
                </LinearGradient>
                <OnlineBadge />
              </View>
              <Text style={[styles.activeUserName, { color: isDark ? '#cbd5e1' : '#f3f5f9d8' }]} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.activeUsersList}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addStoryContainer}>
              <View style={[styles.addStoryCircle, { backgroundColor: isDark ? '#334155' : '#e2e8f0fa' }]}>
                <Feather name="plus" size={24} color={isDark ? '#fff' : '#11367f'} />
              </View>
              <Text style={styles.activeUserName}>Votre story</Text>
            </TouchableOpacity>
          }
        />

        {/* Custom Tabs */}
        <View style={styles.tabsWrapper}>
          {['all', 'unread', 'groups'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab as any); Haptics.selectionAsync(); }}
              style={[
                styles.tabItem,
                activeTab === tab && { backgroundColor: isDark ? '#334155' : '#e2e8f0' }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? (isDark ? '#fff' : '#11367f') : '#f6fbffd4' }
              ]}>
                {tab === 'all' ? 'Tout' : tab === 'unread' ? 'Non lus' : 'Groupes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonElement style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <SkeletonElement style={styles.skeletonTitle} />
            <SkeletonElement style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LottiePlaceholder isDark={isDark} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
        Aucun message trouvé
      </Text>
      <Text style={styles.emptySubtitle}>
        Commencez à discuter avec vos amis ou recherchez un contact.
      </Text>
      <TouchableOpacity style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Inviter des amis</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.mainContainer, { flex: 1 }]}>
      <LinearGradient
        colors={isDark
          ? ['#0f172a', '#334155', '#06B6D4']
          : ['#1e8cbf', '#145470', '#040b0ec3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <BackgroundDecorator isDark={isDark} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {loading && !refreshing ? (
          <>
            {renderHeader()}
            {renderSkeleton()}
          </>
        ) : (
          <Animated.FlatList
            data={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ConversationRow
                item={item}
                index={index}
                isDark={isDark}
                onPress={() => router.push(`/messaging/${item.otherPersonId}`)}
              />
            )}
            ListHeaderComponent={renderHeader()}
            ListEmptyComponent={renderEmpty()}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchConversations(userId!); }}
                tintColor="#06B6D4"
              />
            }
            // Optimisation pour 900+ lignes
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={12}
          />
        )}
      </SafeAreaView>

      {/* FAB (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // Récupérer les propriétaires (users avec un rôle spécifique)
          const { data } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('role', 'owner');
          setOwners(data || []);
          setShowNewChatModal(true);
        }}
      >
        <LinearGradient
          colors={['#06B6D4', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="chatbubbles" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* MODAL NOUVEAU CHAT */}
      {showNewChatModal && (
        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', zIndex: 100
        }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowNewChatModal(false)} accessibilityLabel="Fermer le modal" />
          <Animated.View
            style={{
              backgroundColor: isDark ? '#1e293bdd' : '#ffffffc4',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 10,
              maxHeight: owners.length === 0 ? 520 : '65%',
              minHeight: 520,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 12,
              marginHorizontal: 0,
              overflow: 'hidden',
              transform: [{ translateY: 0 }],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: isDark ? '#fff' : '#0f172a' }}>Nouveau chat </Text>
              <TouchableOpacity onPress={() => setShowNewChatModal(false)} accessibilityLabel="Fermer">
                <Ionicons name="close" size={28} color={isDark ? '#fff' : '#0f172a'} />
              </TouchableOpacity>
            </View>
            {owners.length === 0 ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, minHeight: 180 }}>
                <Animated.View style={{
                  marginBottom: 18,
                  transform: [
                    {
                      scale: new Animated.Value(1).interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 1.15, 1],
                      })
                    }
                  ]
                }}>
                  <Ionicons name="people-outline" size={54} color={isDark ? '#64748b' : '#94a3b8'} />
                </Animated.View>
                <Text style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: 17, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
                  Aucun propriétaire trouvé
                </Text>
                <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 15, textAlign: 'center', marginBottom: 10 }}>
                  Il n'y a actuellement aucun propriétaire disponible pour discuter.
                </Text>
              </View>
            ) : (
              <FlatList
                data={owners}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? '#334155' : '#e5e7eb' }}
                    onPress={() => {
                      setShowNewChatModal(false);
                      router.push(`/messaging/${item.id}`);
                    }}
                    accessibilityLabel={`Démarrer une discussion avec ${item.name}`}
                  >
                    <Image source={{ uri: item.avatar || `https://i.pravatar.cc/150?u=${item.id}` }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 14, backgroundColor: '#e2e8f0' }} />
                    <Text style={{ fontSize: 16, color: isDark ? '#fff' : '#0f172a' }}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 350 }}
              />
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// --- COMPOSANT PLACEHOLDER (Simulation Lottie) ---
const LottiePlaceholder = ({ isDark }: { isDark: boolean }) => (
  <View style={styles.lottieSim}>
    <View style={[styles.circleBig, { borderColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
      <Feather name="message-circle" size={50} color="#94a3b8" />
    </View>
  </View>
);

// --- FEUILLE DE STYLE (SECTION MASSIVE) ---

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  headerContainer: {
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  activeUsersList: {
    paddingBottom: 20,
  },
  addStoryContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  activeUserContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  activeAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  storyGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
  },
  activeUserName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
  },
  onlineBadgeContainer: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeInner: {
    backgroundColor: '#10b981',
  },
  tabsWrapper: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  convoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  convoLeft: {
    marginRight: 15,
  },
  mainAvatarContainer: {
    position: 'relative',
  },
  rowAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0',
  },
  convoCenter: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    paddingBottom: 12,
    justifyContent: 'center',
  },
  convoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rowTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  convoBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  rowMessageUnread: {
    fontWeight: '700',
  },
  unreadIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    width: '40%',
    height: 15,
    borderRadius: 4,
  },
  skeletonSubtitle: {
    width: '80%',
    height: 12,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 50,
  },
  lottieSim: {
    marginBottom: 20,
  },
  circleBig: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});