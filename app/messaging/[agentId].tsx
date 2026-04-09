import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
  Alert, Dimensions, StatusBar, Modal, Animated, ScrollView,
  Pressable, Keyboard, LayoutAnimation,
  UIManager
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Ionicons, Feather, MaterialCommunityIcons,
  FontAwesome5, Entypo, MaterialIcons
} from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Configuration & Utils
import { supabase } from '@/utils/supabase';
import { useColorScheme } from '@/components/useColorScheme';

const { width, height } = Dimensions.get('window');

// --- TYPES & INTERFACES ---
interface Message {
  id: string;
  sender_id: string;
  text: string;
  type: 'text' | 'image' | 'audio' | 'file' | 'video';
  media_url?: string;
  file_name?: string;
  file_size?: number;
  duration?: number; // Pour audio/video
  is_user: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  created_at: string;
}

interface CallSession {
  type: 'audio' | 'video';
  status: 'dialing' | 'connected' | 'ended';
  startTime?: number;
}

// --- COMPOSANTS INTERNES ---

const PulsingAvatar = ({ uri, size = 100 }: { uri: string, size?: number }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseCircle, { width: size * 1.5, height: size * 1.5, borderRadius: size, transform: [{ scale: pulseAnim }] }]} />
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    </View>
  );
};
import Colors from '@/constants/Colors';
// --- CONFIGURATION ---
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const HEADER_MAX_HEIGHT = height * 0.55;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 110 : 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
// const {isDark, dynamicColor, theme} = useTheme();

// --- TYPES ---
interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category?: string;
}

// --- COMPOSANTS INTERNES ---

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
const TypingBubble = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true })
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 16 }}>
      <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#38BDF8', marginHorizontal: 2, opacity: dot1 }} />
      <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#38BDF8', marginHorizontal: 2, opacity: dot2 }} />
      <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#38BDF8', marginHorizontal: 2, opacity: dot3 }} />
    </View>
  );
};

// --- ECRAN PRINCIPAL ---

export default function MegaMessagingScreen() {
  const router = useRouter();
  const { agentId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  // --- REFS ---
  const flatListRef = useRef<FlatList>(null);
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // --- ETATS ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Media Permissions
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();

  // Media & UI States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Pour la visionneuse

  // Call States
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [callTimer, setCallTimer] = useState(0);

  // --- INITIALISATION ---
  useEffect(() => {
    if (conversationId && currentUserId) {
      const channel = subscribeToMessages(conversationId, currentUserId);
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, currentUserId]);
  useEffect(() => {
    const initChat = async () => {
      try {
        // 1. Session utilisateur
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setLoadingHistory(false);
          return;
        }

        const myId = session.user.id;
        setCurrentUserId(myId);

        // 2. Récupération de l'autre utilisateur (Optionnel pour l'affichage, donc on ne bloque pas si erreur)
        try {
          const { data: user } = await supabase.from('users').select('*').eq('id', agentId).single();
          if (user) setOtherUser(user);
        } catch (e) { console.log("Erreur user:", e); }

        // 3. Trouver/Créer convo (On utilise try/catch ici car c'est le point sensible)
        const { data: conv, error: rpcError } = await supabase.rpc('get_or_create_conversation', {
          p_user_id: myId,
          p_agent_id: agentId
        });

        if (rpcError) {
          console.error("Erreur RPC Convo:", rpcError);
          // Si le RPC échoue, on tente une requête manuelle simple pour ne pas bloquer
          const { data: manualConv } = await supabase
            .from('conversations')
            .select('id')
            .or(`user_id.eq.${myId},agent_id.eq.${myId}`)
            .single();

          if (manualConv && manualConv.id) {
            setConversationId(manualConv.id);
            await loadMessages(manualConv.id, myId);
            subscribeToMessages(manualConv.id, myId);
          } else {
            console.warn('manualConv is missing or has no id:', manualConv);
          }
        } else if (Array.isArray(conv) && conv.length > 0 && conv[0].id) {
          setConversationId(conv[0].id);
          await loadMessages(conv[0].id, myId);
          subscribeToMessages(conv[0].id, myId);
        } else {
          console.warn('conv is missing or has no id:', conv);
        }

      } catch (err) {
        console.error("Erreur globale initChat:", err);
      } finally {
        // TRÈS IMPORTANT : On arrête le spinner quoi qu'il arrive
        setLoadingHistory(false);
      }
    };

    initChat();

    return () => {
      supabase.removeAllChannels();
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, [agentId]);

  // --- LOGIQUE MESSAGES ---

  const loadMessages = async (id: string, myId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false }) // OK pour inverted
      .limit(50);


    if (data) {
      const formattedMessages = data.map(msg => ({
        ...msg,
        is_user: msg.sender_id === myId // Utilisez myId reçu en paramètre
      }));
      setMessages(formattedMessages);
    }
    setLoadingHistory(false);
  };

  const subscribeToMessages = (id: string, userId: string) => {
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((current) => {
            const exists = current.find(m => m.id === newMessage.id);
            if (exists) return current;
            const formattedMsg = {
              ...newMessage,
              is_user: newMessage.sender_id === userId,
            };
            return [formattedMsg, ...current];
          });
          if (newMessage.sender_id !== userId) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      )
      // Typing event (custom broadcast)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId !== userId) {
          setIsTyping(true);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
        }
      })
      .subscribe();
    return channel;
  };

  const sendMessage = async (type: Message['type'], content: string, extra = {}) => {
    if (!content.trim() && type === 'text') return;
    if (!conversationId || !currentUserId) {
      Alert.alert("Erreur", "Conversation non initialisée");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newMsg: Message = {
      id: tempId,
      sender_id: currentUserId,
      text: type === 'text' ? content : '',
      type,
      media_url: type !== 'text' ? content : undefined,
      is_user: true,
      status: 'sending',
      created_at: new Date().toISOString(),
      ...extra
    };

    setMessages(prev => [newMsg, ...prev]);
    setInputText('');

    const insertObj: any = {
      conversation_id: conversationId,
      sender_id: currentUserId,
      text: type === 'text' ? content : '',
      type: type,
      media_url: type !== 'text' ? content : null,
      // file_name: (extra as any).file_name || null
    };
    // Only add duration if the column exists in your DB schema
    // insertObj.duration = (extra as any).duration || null;

    const { data, error } = await supabase
      .from('messages')
      .insert([insertObj])
      .select()
      .single();

    if (error) {
      console.error("Erreur envoi:", error);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } else {
      // On remplace le message temporaire par le vrai message de la DB
      setMessages(prev => prev.map(m => m.id === tempId ? { ...data, is_user: true, status: 'sent' } : m));
    }
  };

  // --- GESTION DES MÉDIAS (UPLOAD) ---

  const getMimeType = (ext: string, folder: string) => {
    if (folder === 'video') {
      if (ext === 'mp4') return 'video/mp4';
      if (ext === 'mov') return 'video/quicktime';
      if (ext === 'avi') return 'video/x-msvideo';
      if (ext === 'mkv') return 'video/x-matroska';
      return 'video/mp4';
    }
    if (folder === 'audio') {
      if (ext === 'mp3') return 'audio/mpeg';
      if (ext === 'wav') return 'audio/wav';
      if (ext === 'aac') return 'audio/aac';
      if (ext === 'm4a') return 'audio/mp4';
      return 'audio/mpeg';
    }
    if (folder === 'files' && ext === 'pdf') return 'application/pdf';
    if (folder === 'image' || folder === 'images') {
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'png') return 'image/png';
      if (ext === 'gif') return 'image/gif';
      return 'image/jpeg';
    }
    return 'application/octet-stream';
  };

  const uploadFile = async (uri: string, folder: string): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const ext = uri.split('.').pop()?.toLowerCase() || '';
      const fileName = `${currentUserId}/${Date.now()}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      // Vérification de la taille du fichier (optionnel, mais conseillé)
      // const fileInfo = await FileSystem.getInfoAsync(uri);
      // if (fileInfo.size && fileInfo.size > 50 * 1024 * 1024) {
      //   Alert.alert('Fichier trop volumineux', 'La taille maximale autorisée est de 50 Mo.');
      //   setIsUploading(false);
      //   return null;
      // }

      const mimeType = getMimeType(ext, folder);
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType
      } as any);

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, formData, { upsert: true });

      if (error) {
        console.error('Erreur upload:', error);
        Alert.alert('Erreur d\'upload', error.message || 'Impossible d\'envoyer le fichier.');
        return null;
      }

      const { data: publicData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);
      if (!publicData || !publicData.publicUrl) {
        Alert.alert('Erreur', 'Impossible de récupérer l\'URL du fichier envoyé.');
        return null;
      }
      return publicData.publicUrl;
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur d'upload", "Impossible d'envoyer le fichier.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // --- AUDIO ---

  const startAudioRecording = async () => {
    try {
      const { granted } = await requestMic();
      if (!granted) return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecordingAudio(true);

      let sec = 0;
      const interval = setInterval(() => {
        setAudioDuration(++sec);
      }, 1000);
      // (recording as any)._interval = interval;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error(err);
    }
  };

  const stopAudioRecording = async (shouldSend: boolean) => {
    if (!recordingRef.current) return;

    clearInterval((recordingRef.current as any)._interval);
    setIsRecordingAudio(false);
    setAudioDuration(0);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      if (shouldSend && uri) {
        const url = await uploadFile(uri, 'audio');
        if (url) sendMessage('audio', url, { duration: audioDuration });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- VIDÉO ---

  const startVideoRecording = async () => {
    if (!cameraRef.current || isRecordingVideo) return;
    setIsRecordingVideo(true);
    setVideoTimer(0);

    const interval = setInterval(() => setVideoTimer(t => t + 1), 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60
      });
      clearInterval(interval);
      if (video) {
        const url = await uploadFile(video.uri, 'video');
        if (url) sendMessage('video', url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecordingVideo(false);
      setShowCamera(false);
    }
  };

  // --- APPELS ---
  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!res.canceled) {
        const url = await uploadFile(res.assets[0].uri, 'files');
        if (url) sendMessage('file', url, { file_name: res.assets[0].name });
      }
    } catch (err) {
      console.log(err);
    }
  };
  const startCall = (type: 'audio' | 'video') => {
    setCallSession({ type, status: 'dialing' });
    setCallTimer(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Simuler connexion après 2s
    setTimeout(() => {
      setCallSession(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 3000);
  };

  // useEffect(() => {
  //   let interval: NodeJS.Timeout;
  //   if (callSession?.status === 'connected') {
  //     interval = setInterval(() => setCallTimer(t => t + 1), 1000);
  //   }
  //   return () => clearInterval(interval);
  // }, [callSession?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };



  // --- AUDIO PLAYER STATE ---
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioPlayback, setAudioPlayback] = useState<Audio.Sound | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDurationMs, setAudioDurationMs] = useState<number>(0);
  const pickAndSendContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès aux contacts est nécessaire.');
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();

      // Si l'utilisateur a sélectionné un contact
      if (contact) {
        let contactText = `👤 Contact: ${contact.name}`;

        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          const phones = contact.phoneNumbers.map(p => p.number).join(', ');
          contactText += `\n📞 Tél: ${phones}`;
        }

        if (contact.emails && contact.emails.length > 0) {
          const emails = contact.emails.map(e => e.email).join(', ');
          contactText += `\n📧 Email: ${emails}`;
        }

        // SOLUTION : On attend 500ms que le répertoire se ferme 
        // pour éviter que le thread UI ne sature et plante
        setTimeout(() => {
          sendMessage('text', contactText);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 500);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du contact:", error);
      // On ne met pas d'Alert ici car si l'utilisateur annule, 
      // certains OS considèrent cela comme une erreur.
    }
  };
  useEffect(() => {
    return () => {
      if (audioPlayback) {
        audioPlayback.unloadAsync();
      }
    };
  }, [audioPlayback]);
const MessageVideo = ({ sourceUri }: { sourceUri: string }) => {
  const player = useVideoPlayer(sourceUri, (player : any) => {
    player.loop = false;
    player.muted = true;
  });

  return (
    <VideoView
      style={styles.messageVideo}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};
  const handlePlayPauseAudio = async (item: Message) => {
    if (!item.media_url) return;
    if (playingAudioId === item.id) {
      if (audioPlayback) {
        await audioPlayback.stopAsync();
        await audioPlayback.unloadAsync();
      }
      setPlayingAudioId(null);
      setAudioPlayback(null);
      setAudioProgress(0);
      setAudioDurationMs(0);
      return;
    }
    if (audioPlayback) {
      await audioPlayback.stopAsync();
      await audioPlayback.unloadAsync();
    }
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.media_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioProgress(status.positionMillis || 0);
            setAudioDurationMs(status.durationMillis || 0);
            if (status.didJustFinish) {
              setPlayingAudioId(null);
              setAudioPlayback(null);
              setAudioProgress(0);
              setAudioDurationMs(0);
            }
          }
        }
      );
      setPlayingAudioId(item.id);
      setAudioPlayback(sound);
    } catch (e) {
      setPlayingAudioId(null);
      setAudioPlayback(null);
    }
  };

  const renderMessage = useCallback(({ item, index }: { item: Message, index: number }) => {
    const isMine = item.sender_id === currentUserId;
    const showDateHeader = index === messages.length - 1 ||
      format(new Date(item.created_at), 'yyyy-MM-dd') !== format(new Date(messages[index + 1]?.created_at), 'yyyy-MM-dd');

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {format(new Date(item.created_at), 'EEEE d MMMM', { locale: fr })}
            </Text>
          </View>
        )}

        <View style={[styles.messageWrapper, isMine ? styles.mineWrapper : styles.theirWrapper]}>
          <View style={[
            styles.bubble,
            isMine ? styles.myBubble : styles.theirBubble,
            item.type === 'image' && styles.imageBubble
          ]}>

            {/* Contenu Image */}
            {item.type === 'image' && (
              <TouchableOpacity onPress={() => setSelectedImage(item.media_url!)}>
                <Image source={{ uri: item.media_url }} style={styles.messageImage} resizeMode="cover" />
              </TouchableOpacity>
            )}

            {/* Contenu Vidéo */}
            {item.type === 'video' && (
              <View style={styles.videoContainer}>
                <MessageVideo sourceUri={item.media_url!} />
              </View>
            )}

            {/* Contenu Audio */}
            {item.type === 'audio' && (
              <View style={styles.audioBubbleContent}>
                <TouchableOpacity style={styles.playBtn} onPress={() => handlePlayPauseAudio(item)}>
                  <Ionicons
                    name={playingAudioId === item.id ? 'pause' : 'play'}
                    size={24}
                    color={isMine ? "#FFF" : "#06B6D4"}
                  />
                </TouchableOpacity>
                <View style={styles.audioVisualizer}>
                  <View style={[styles.audioBar, { height: 15, backgroundColor: isMine ? '#E0F2FE' : '#06B6D4' }]} />
                  <View style={[styles.audioBar, { height: 25, backgroundColor: isMine ? '#E0F2FE' : '#06B6D4' }]} />
                  <View style={[styles.audioBar, { height: 10, backgroundColor: isMine ? '#E0F2FE' : '#06B6D4' }]} />
                </View>
                <Text style={[styles.durationText, { color: isMine ? '#FFF' : '#64748B', minWidth: 48 }]}>
                  {playingAudioId === item.id && audioDurationMs > 0
                    ? `${Math.floor((audioProgress || 0) / 1000)}:${((audioProgress || 0) / 1000) % 60 < 10 ? '0' : ''}${Math.floor((audioProgress || 0) / 1000) % 60}`
                    : formatTime(item.duration || 0)}
                </Text>
              </View>
            )}

            {/* Contenu Fichier */}
            {item.type === 'file' && (
              <TouchableOpacity style={styles.fileContainer}>
                <View style={styles.fileIconBox}>
                  <FontAwesome5 name="file-pdf" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.fileName, { color: isMine ? '#FFF' : '#1E293B' }]} numberOfLines={1}>
                    {item.file_name || "Document.pdf"}
                  </Text>
                  <Text style={styles.fileSize}>1.2 MB • PDF</Text>
                </View>
                <Feather name="download" size={18} color={isMine ? "#FFF" : "#64748B"} />
              </TouchableOpacity>
            )}

            {/* Contenu Texte */}
            {item.text !== '' && (
              <Text style={[styles.messageText, { color: isMine ? '#FFF' : '#1E293B' }]}>
                {item.text}
              </Text>
            )}

            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, { color: isMine ? 'rgba(255,255,255,0.7)' : '#94A3B8' }]}>
                {format(new Date(item.created_at), 'HH:mm')}
              </Text>
              {isMine && (
                <Ionicons
                  name={item.status === 'read' ? "checkmark-done" : "checkmark"}
                  size={14}
                  color={item.status === 'read' ? "#34D399" : "rgba(255,255,255,0.7)"}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }, [messages, currentUserId, playingAudioId, audioProgress, audioDurationMs]);

  // --- INTERFACES MODALES ---
  // --- RENDU DES MESSAGES ---
  if (!currentUserId) {
    return (
      //  creer un skeleton de chargement pour le chat

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
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER PREMIUM */}
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.header}>
        <View style={styles.headerTop}>
          {/* <TouchableOpacity onPress={() => {
           
              router.push('/messaging/index');
            
          
          }} 
          style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#06B6D4" />
          </TouchableOpacity> */}

          <Pressable style={styles.userInfo} onPress={() => {/* Profil */ }}>
            <Image source={{ uri: otherUser?.avatar || `https://i.pravatar.cc/150?u=${agentId}` }} style={styles.headerAvatar} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.headerName, { color: isDark ? '#FFF' : '#1E293B' }]}>{otherUser?.name || "..."}</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerStatus}>En ligne</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => startCall('video')} style={styles.actionBtn}>
              <Feather name="video" size={20} color="#06B6D4" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => startCall('audio')} style={styles.actionBtn}>
              <Feather name="phone" size={20} color="#06B6D4" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Entypo name="dots-three-vertical" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      {/* LISTE DES MESSAGES */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        inverted
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 10 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        ListEmptyComponent={() => loadingHistory ? <ActivityIndicator size="large" color="#06B6D4" style={{ marginTop: 100 }} /> : null}
      />

      {/* BARRE D'ENTRÉE (INPUT) */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>

          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              setShowAttachMenu(!showAttachMenu);
            }}
          >
            <Animated.View style={{ transform: [{ rotate: showAttachMenu ? '45deg' : '0deg' }] }}>
              <Feather name="plus" size={24} color="#06B6D4" />
            </Animated.View>
          </TouchableOpacity>

          <View style={[styles.textInputWrapper, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
            {isRecordingAudio ? (
              <View style={styles.recordingRow}>
                <View style={styles.redDot} />
                <Text style={styles.recordingTime}>{formatTime(audioDuration)}</Text>
                <Text style={styles.slideCancel}>Faites glisser pour annuler</Text>
              </View>
            ) : (
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: isDark ? '#FFF' : '#1E293B' }]}
                placeholder="Votre message..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={text => {
                  setInputText(text);
                  if (conversationId && currentUserId) {
                    supabase.channel(`chat:${conversationId}`).send({
                      type: 'broadcast',
                      event: 'typing',
                      payload: { userId: currentUserId }
                    });
                  }
                }}
                multiline
                onFocus={() => setShowAttachMenu(false)}
              />
            )}

            {!isRecordingAudio && (
              <TouchableOpacity onPress={() => setShowCamera(true)} style={styles.camInputBtn}>
                <Feather name="camera" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.mainActionWrapper}>
            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => sendMessage('text', inputText)}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.micButton, isRecordingAudio && styles.micButtonActive]}
                onLongPress={startAudioRecording}
                onPressOut={() => stopAudioRecording(true)}
              >
                <MaterialCommunityIcons name="microphone" size={22} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* MENU ATTACHEMENTS */}
        {showAttachMenu && (
          <View style={[styles.attachMenu, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachScroll}>
              {[
                { label: 'Document', icon: 'file-text', color: '#7C3AED', action: pickDocument },
                {
                  label: 'Galerie', icon: 'image', color: '#06B6D4', action: async () => {
                    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
                    if (!res.canceled) {
                      const url = await uploadFile(res.assets[0].uri, 'images');
                      if (url) sendMessage('image', url);
                    }
                  }
                },
                {
                  label: 'Vidéo', icon: 'video', color: '#F43F5E', action: async () => {
                    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
                    if (!res.canceled) {
                      const url = await uploadFile(res.assets[0].uri, 'video');
                      if (url) sendMessage('video', url);
                    }
                  }
                },
                { label: 'Audio', icon: 'headphones', color: '#F59E0B', action: () => { } },
                { label: 'Lieu', icon: 'map-pin', color: '#10B981', action: () => { } },
                {
                  label: 'Contact', icon: 'user', color: '#3B82F6', action: async () => {
                    // const { status } = await Contacts.requestPermissionsAsync();
                    // onPress={} 
                    pickAndSendContact();
                  }
                },
              ].map((item, i) => (
                <TouchableOpacity key={i} style={styles.attachItem} onPress={item.action}>
                  <View style={[styles.attachIconCircle, { backgroundColor: item.color }]}>
                    <Feather name={item.icon as any} size={22} color="#FFF" />
                  </View>
                  <Text style={[styles.attachLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={{ height: insets.bottom + 5 }} />
      </KeyboardAvoidingView>

      {/* --- MODALES --- */}

      {/* 1. CAMÉRA AVANCÉE */}
      <Modal visible={showCamera} animationType="slide">
        {camPerm?.granted ? (
          <CameraView
            style={styles.fullCamera}
            ref={cameraRef}
            facing={cameraType}
            mode={isRecordingVideo ? "video" : "picture"}
          >
            <SafeAreaView style={styles.cameraControls}>
              <View style={styles.camHeader}>
                <TouchableOpacity onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                {isRecordingVideo && (
                  <View style={styles.videoBadge}>
                    <View style={styles.redDot} />
                    <Text style={styles.videoBadgeText}>{formatTime(videoTimer)}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setCameraType(t => t === 'back' ? 'front' : 'back')}>
                  <MaterialIcons name="flip-camera-ios" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.camFooter}>
                <Text style={styles.camHint}>
                  Appuyer pour Photo • Long pour Vidéo
                </Text>
                <TouchableOpacity
                  onLongPress={startVideoRecording}
                  onPressOut={() => isRecordingVideo && cameraRef.current?.stopRecording()}
                  onPress={async () => {
                    const p = await cameraRef.current?.takePictureAsync();
                    if (p) {
                      setShowCamera(false);
                      const url = await uploadFile(p.uri, 'images');
                      if (url) sendMessage('image', url);
                    }
                  }}
                  style={[styles.bigCaptureBtn, isRecordingVideo && { borderColor: '#EF4444' }]}
                >
                  <View style={[styles.innerCapture, isRecordingVideo && { backgroundColor: '#EF4444', borderRadius: 10 }]} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </CameraView>
        ) : (
          <View style={[styles.fullCamera, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
            <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20 }}>Autorisez l'accès à la caméra pour utiliser cette fonctionnalité.</Text>
            <TouchableOpacity onPress={requestCam} style={{ backgroundColor: '#06B6D4', padding: 16, borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Autoriser la caméra</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCamera(false)} style={{ marginTop: 20 }}>
              <Text style={{ color: '#fff', textDecorationLine: 'underline' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* 2. VISIONNEUSE D'IMAGE */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.closeViewer} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage! }} style={styles.viewerImage} resizeMode="contain" />
        </View>
      </Modal>

      {/* 3. APPEL FULL SCREEN */}
      <Modal visible={!!callSession} animationType="slide">
        <BlurView intensity={100} tint="dark" style={styles.callModal}>
          <SafeAreaView style={styles.callContent}>
            <View style={styles.callInfoBox}>
              <PulsingAvatar uri={otherUser?.avatar || `https://i.pravatar.cc/150?u=${agentId}`} />
              <Text style={styles.callUserName}>{otherUser?.name}</Text>
              <Text style={styles.callStatusText}>
                {callSession?.status === 'dialing' ? 'Appel en cours...' : formatTime(callTimer)}
              </Text>
            </View>

            {callSession?.type === 'video' && callSession?.status === 'connected' && (
              <View style={styles.miniVideoPreview}>
                <CameraView style={{ flex: 1 }} facing="front" />
              </View>
            )}

            <View style={styles.callActionsBox}>
              <TouchableOpacity style={styles.callCircleBtn}>
                <Feather name="mic-off" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callCircleBtn, { backgroundColor: '#EF4444', width: 80, height: 80 }]}
                onPress={() => setCallSession(null)}
              >
                <MaterialCommunityIcons name="phone-hangup" size={35} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.callCircleBtn}>
                <Ionicons name="videocam-off" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>
      </Modal>

      {/* 4. OVERLAY D'UPLOAD */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <BlurView intensity={30} style={styles.uploadCard}>
            <ActivityIndicator size="large" color="#06B6D4" />
            <Text style={styles.uploadText}>Envoi en cours...</Text>
          </BlurView>
        </View>
      )}

    </SafeAreaView>
  );
}

// --- STYLES (TRÈS DÉTAILLÉS) ---

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    zIndex: 10
  },
  skeleton: { backgroundColor: '#333', borderRadius: 12, flex: 1 },

  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  backBtn: { padding: 5 },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 5 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8F0' },
  headerName: { fontSize: 17, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 5 },
  headerStatus: { fontSize: 12, color: '#64748B' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 10, marginLeft: 2 },

  dateHeader: { alignItems: 'center', marginVertical: 20 },
  dateHeaderText: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize'
  },

  messageWrapper: { marginBottom: 4, flexDirection: 'row' },
  mineWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: width * 0.75,
    padding: 10,
    borderRadius: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  myBubble: {
    backgroundColor: '#06B6D4',
    borderBottomRightRadius: 4,
    marginRight: 4
  },
  theirBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    marginLeft: 4,
    borderWidth: 0.5,
    borderColor: '#E2E8F0'
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4
  },
  messageTime: { fontSize: 10 },

  imageBubble: { padding: 4 },
  messageImage: { width: width * 0.7, height: 250, borderRadius: 16 },

  videoContainer: { width: width * 0.7, height: 200, borderRadius: 16, overflow: 'hidden' },
  messageVideo: { flex: 1 },

  audioBubbleContent: { flexDirection: 'row', alignItems: 'center', minWidth: 150, paddingVertical: 5 },
  playBtn: { marginRight: 10 },
  audioVisualizer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  audioBar: { width: 3, borderRadius: 2 },
  durationText: { fontSize: 12, marginLeft: 10 },

  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    width: width * 0.65
  },
  fileIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  fileName: { fontSize: 14, fontWeight: '600' },
  fileSize: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingTop: 5
  },
  attachBtn: { padding: 10, marginBottom: 2 },
  textInputWrapper: {
    flex: 1,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 5,
    minHeight: 45
  },
  textInput: { flex: 1, paddingVertical: 8, fontSize: 16, maxHeight: 120 },
  camInputBtn: { padding: 8 },
  mainActionWrapper: { marginLeft: 8, marginBottom: 2 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#06B6D4',
    justifyContent: 'center',
    alignItems: 'center'
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center'
  },
  micButtonActive: { backgroundColor: '#EF4444', transform: [{ scale: 1.2 }] },

  recordingRow: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 40 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 8 },
  recordingTime: { fontWeight: 'bold', color: '#EF4444', marginRight: 15 },
  slideCancel: { color: '#94A3B8', fontSize: 13 },

  attachMenu: {
    paddingVertical: 15,
    borderTopWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  attachScroll: { paddingHorizontal: 20 },
  attachItem: { alignItems: 'center', marginRight: 25 },
  attachIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  attachLabel: { fontSize: 12, fontWeight: '500' },

  fullCamera: { flex: 1 },
  cameraControls: { flex: 1, justifyContent: 'space-between', padding: 20 },
  camHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },
  videoBadgeText: { color: '#FFF', fontWeight: 'bold', marginLeft: 5 },
  camFooter: { alignItems: 'center', paddingBottom: 40 },
  camHint: { color: '#FFF', marginBottom: 20, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
  bigCaptureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  innerCapture: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFF' },

  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  closeViewer: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  viewerImage: { width: '100%', height: '80%' },

  callModal: { flex: 1 },
  callContent: { flex: 1, justifyContent: 'space-around', alignItems: 'center' },
  callInfoBox: { alignItems: 'center' },
  pulseContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  pulseCircle: { position: 'absolute', backgroundColor: 'rgba(6, 182, 212, 0.2)' },
  callUserName: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 20 },
  callStatusText: { fontSize: 18, color: '#06B6D4', marginTop: 10 },
  miniVideoPreview: {
    width: 120,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'absolute',
    right: 20,
    top: 60,
    borderWidth: 1,
    borderColor: '#FFF'
  },
  callActionsBox: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-evenly' },
  callCircleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },

  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  uploadCard: { padding: 30, borderRadius: 20, alignItems: 'center', overflow: 'hidden' },
  uploadText: { color: '#FFF', marginTop: 15, fontWeight: '600' }
});