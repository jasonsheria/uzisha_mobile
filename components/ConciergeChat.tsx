import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image, FlatList,
    KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
    Alert, Dimensions, StatusBar, Modal, Animated, ScrollView,
    Pressable, LayoutAnimation
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5, Entypo, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { ResizeMode } from 'expo-av';
import { Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from '@/components/useColorScheme';
import {
    pickImage,

} from '@/utils/uploadService';

const { width } = Dimensions.get('window');

interface ConciergeChatProps {
    otherUserId: string;
    onClose: () => void;
    boutique?: Boutique; // Optionnel, pour passer les infos de la boutique au chat
}

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
interface Boutique {
    id: string;
    name: string;
    user_id: string;
    type: string[];
    ville: string;
    province: string;
    territoire: string;
    commune: string;
    description: string;
    localization: [];
    adresse: string;
    phone: string;
    image: string;
    logo: string;
    category_tags: string[];
    // autres champs pertinents
}

export default function ConciergeChat({ otherUserId, onClose, boutique }: ConciergeChatProps) {
    const insets = useSafeAreaInsets();
    const isDark = useColorScheme() === 'dark';
    const flatListRef = useRef<FlatList>(null);
    const cameraRef = useRef<CameraView>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const inputRef = useRef<TextInput>(null);
    const scrollY = useRef(new Animated.Value(0)).current;
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [camPerm, requestCam] = useCameraPermissions();
    const [micPerm, requestMic] = useMicrophonePermissions();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [videoTimer, setVideoTimer] = useState(0);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [callSession, setCallSession] = useState<CallSession | null>(null);
    const [callTimer, setCallTimer] = useState(0);
    useEffect(() => {
        if (conversationId && currentUserId) {
            const channel = subscribeToMessages(conversationId, currentUserId);
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [conversationId, currentUserId]);
    // Initialisation: recherche ou création de la conversation (comme dans la messagerie)
    useEffect(() => {
        const initChat = async () => {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError || !session) {
                    setLoadingHistory(false);
                    return;
                }
                const myId = session.user.id;
                setCurrentUserId(myId);
                try {
                    const { data: user } = await supabase.from('users').select('*').eq('id', boutique?.user_id).single();
                    if (user) setOtherUser(user);
                } catch (e) { }
                // Création ou récupération de la conversation
                const { data: conv, error: rpcError } = await supabase.rpc('get_or_create_conversation', {
                    p_user_id: myId,
                    p_agent_id: boutique?.user_id
                });
                let conversation_id = null;
                if (rpcError || !conv || !Array.isArray(conv) || conv.length === 0) {
                    // Fallback manuel
                    const { data: manualConv } = await supabase
                        .from('conversations')
                        .select('id')
                        .or(`user_id.eq.${myId},agent_id.eq.${boutique?.user_id}`)
                        .single();
                    if (manualConv && manualConv.id) {
                        conversation_id = manualConv.id;
                    }
                } else {
                    conversation_id = conv[0].id;
                }
                if (conversation_id) {
                    setConversationId(conversation_id);
                    await loadMessages(conversation_id, myId);
                    subscribeToMessages(conversation_id, myId);
                }
            } catch (err) {
                setLoadingHistory(false);
            } finally {
                setLoadingHistory(false);
            }
        };
        initChat();
        return () => {
            supabase.removeAllChannels();
            if (soundRef.current) soundRef.current.unloadAsync();
        };
    }, [otherUserId]);
    const playMessageAudio = async (url: string) => {
        try {
            // Décharger le son précédent s'il existe
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync(
                { uri: url },
                { shouldPlay: true }
            );
            soundRef.current = sound;

            // Optionnel : Gérer la fin de la lecture
            sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    // console.log("Lecture terminée");
                }
            });
        } catch (error) {
            Alert.alert("Erreur", "Impossible de lire cet audio.");
        }
    };
    // --- GESTION PHOTO ET VIDÉO ---
    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
                if (photo) {
                    setShowCamera(false);
                    const url = await uploadFile(photo.uri, 'image');
                    if (url) sendMessage('image', url);
                }
            } catch (e) {
                Alert.alert("Erreur", "Impossible de prendre la photo");
            }
        }
    };

    const toggleVideoRecording = async () => {
        if (isRecordingVideo) {
            cameraRef.current?.stopRecording();
        } else {
            try {
                setIsRecordingVideo(true);
                setVideoTimer(0);
                const timer = setInterval(() => setVideoTimer(t => t + 1), 1000);

                const video = await cameraRef.current?.recordAsync({ maxDuration: 60 });

                clearInterval(timer);
                setIsRecordingVideo(false);
                if (video) {
                    setShowCamera(false);
                    const url = await uploadFile(video.uri, 'video');
                    if (url) sendMessage('video', url);
                }
            } catch (e) {
                setIsRecordingVideo(false);
                Alert.alert("Erreur", "Impossible d'enregistrer la vidéo");
            }
        }
    };
    // --- LOGIQUE MESSAGES ---
    const loadMessages = async (id: string, myId: string) => {
        setLoadingHistory(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: false })
            .limit(50);
        if (data && data.length > 0) {
            const formattedMessages = data.map(msg => ({
                ...msg,
                is_user: msg.sender_id === myId
            }));
            setMessages(formattedMessages);
        } else {
            // Message de bienvenue si aucune conversation
            setMessages([]);
        }
        setLoadingHistory(false);
    };

    // Fonction d'envoi de message
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
        };

        const { data, error } = await supabase
            .from('messages')
            .insert([insertObj])
            .select()
            .single();

        if (error) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
        } else {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...data, is_user: true, status: 'sent' } : m));
        }
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
                        // 1. Vérifie si le message (par ID réel) existe déjà
                        const exists = current.find(m => m.id === newMessage.id);
                        if (exists) return current;

                        // 2. OPTIONNEL : Si vous utilisez des tempId, vérifiez si ce nouveau message 
                        // est la version "confirmée" d'un message en cours d'envoi.
                        // On filtre les doublons potentiels basés sur le texte et le sender à la même seconde
                        const isOptimisticMatch = current.find(m =>
                            m.status === 'sending' &&
                            m.text === newMessage.text &&
                            m.sender_id === newMessage.sender_id
                        );

                        const formattedMsg = {
                            ...newMessage,
                            is_user: newMessage.sender_id === userId,
                            status: 'sent' as const,
                        };

                        if (isOptimisticMatch) {
                            // On remplace le message temporaire par le vrai
                            return current.map(m => m.id === isOptimisticMatch.id ? formattedMsg : m);
                        }

                        return [formattedMsg, ...current];
                    });
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

    const uploadFile = async (uri: string, folder: string): Promise<string | null> => {
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const ext = uri.split('.').pop();
            const fileName = `${currentUserId}/${Date.now()}.${ext}`;
            const filePath = `${folder}/${fileName}`;

            const formData = new FormData();
            formData.append('file', {
                uri,
                name: fileName,
                type: `image/${ext}` // simplification
            } as any);

            const { data, error } = await supabase.storage
                .from('chat-media')
                .upload(filePath, formData, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (e) {
            console.error(e);
            Alert.alert("Erreur d'upload", "Impossible d'envoyer le fichier.");
            return null;
        } finally {
            setIsUploading(false);
        }
    };


    const startAudioRecording = async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') return;

            await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
            const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            recordingRef.current = recording;
            setIsRecordingAudio(true);

            // Timer pour l'UI
            const interval = setInterval(async () => {
                const status = await recording.getStatusAsync();
                setAudioDuration(Math.floor(status.durationMillis / 1000));
            }, 1000);
            (recording as any)._interval = interval;
        } catch (err) { console.error(err); }
    };

    const stopAudioRecording = async (shouldSend: boolean) => {
        if (!recordingRef.current) return;
        setIsRecordingAudio(false);
        clearInterval((recordingRef.current as any)._interval);

        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;

        if (shouldSend && uri) {
            const url = await uploadFile(uri, 'audio');
            if (url) sendMessage('audio', url, { duration: audioDuration });
        }
        setAudioDuration(0);
    };
    // ...existing code from chat logic (loadMessages, subscribeToMessages, sendMessage, uploadFile, etc.)
    // ...existing code for rendering messages, input, attachments, camera, etc.

    // Pour la démo, on affiche juste un placeholder si l'utilisateur n'est pas connecté

    // --- RENDU COMPLET DU CHAT ---
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    const playSound = async (uri: string) => {
        try {
            if (soundRef.current) {
                await soundRef.current.unloadAsync();
            }
            const { sound } = await Audio.Sound.createAsync({ uri });
            soundRef.current = sound;
            await sound.playAsync();
        } catch (e) {
            Alert.alert("Erreur", "Impossible de lire l'audio");
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
                                <Video
                                    source={{ uri: item.media_url! }}
                                    style={styles.messageVideo}
                                    useNativeControls
                                    resizeMode={ResizeMode.CONTAIN}
                                />
                            </View>
                        )}

                        {/* Contenu Audio */}
                        {item.type === 'audio' && (
                            <View style={styles.audioBubbleContent}>
                                <TouchableOpacity
                                    style={styles.playBtn}
                                    onPress={() => playMessageAudio(item.media_url!)} // <--- Ajout de l'événement
                                >
                                    <Ionicons name="play" size={24} color={isMine ? "#FFF" : "#06B6D4"} />
                                </TouchableOpacity>
                                <View style={styles.audioVisualizer}>
                                    <View style={[styles.audioBar, { height: 15, backgroundColor: isMine ? '#E0F2FE' : '#06B6D4' }]} />
                                    <View style={[styles.audioBar, { height: 25, backgroundColor: isMine ? '#E0F2FE' : '#06B6D4' }]} />
                                    <View style={[styles.audioBar, { height: 10, backgroundColor: isMine ? '#E0F2FE' : '#06B6D4' }]} />
                                </View>
                                <Text style={[styles.durationText, { color: isMine ? '#FFF' : '#64748B' }]}>
                                    {formatTime(item.duration || 0)}
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
    }, [messages, currentUserId]);
    const AttachItem = ({ icon, label, color, onPress }: any) => (
        <TouchableOpacity style={styles.attachItem} onPress={onPress}>
            <View style={[styles.attachIconCircle, { backgroundColor: color }]}>
                <Feather name={icon} size={24} color="#FFF" />
            </View>
            <Text style={styles.attachLabel}>{label}</Text>
        </TouchableOpacity>
    );
    if (!currentUserId) {
        return (
            // creer un preloader plus joli pour le chat
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#06B6D4" />
                <Text style={{ marginTop: 12, color: '#64748B' }}>Chargement du chat...</Text>
            </View>
        );
    }
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            {/* HEADER MODAL BOUTIQUE ULTRA PRO */}
            {/* Ajouter le clavier pour que il apparait bas de input */}

            <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={[styles.header, { overflow: 'hidden', borderBottomWidth: 0, backgroundColor: 'transparent', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: Colors.primary, shadowOpacity: 0.12, shadowRadius: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, backgroundColor: isDark ? Colors.dark.background : Colors.gray100, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomColor: isDark ? Colors.dark.border : Colors.light.border, borderBottomWidth: 1 }}>
                    <TouchableOpacity onPress={onClose} style={[styles.backBtn, { marginRight: 10, backgroundColor: Colors.primary, borderRadius: 12, padding: 4 }]}>
                        <Ionicons name="chevron-back" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <Image source={{ uri: boutique?.logo || boutique?.image || `https://i.pravatar.cc/150?u=${boutique?.id}` }} style={{ width: 44, height: 44, borderRadius: 14, marginRight: 14, backgroundColor: Colors.gray200, borderWidth: 2, borderColor: Colors.primary }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? Colors.dark.text : Colors.primary, letterSpacing: 0.2 }} numberOfLines={1}>
                            {boutique?.name || 'Boutique'}
                        </Text>
                        <Text style={{ fontSize: 13, color: isDark ? Colors.dark.textSecondary : Colors.gray600, marginTop: 2 }} numberOfLines={1}>
                            {boutique?.type ? boutique.type.join(', ') : 'Type de boutique'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                        <TouchableOpacity style={{ padding: 7, backgroundColor: Colors.primary, borderRadius: 10, marginRight: 2 }}>
                            <Feather name="phone" size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 7, backgroundColor: Colors.accent, borderRadius: 10, marginLeft: 8 }}>
                            <Feather name="video" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>

            {/* LISTE DES MESSAGES */}

            <View style={{ flex: 1, backgroundColor: isDark ? Colors.dark.background : Colors.gray100 }}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    inverted
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: 20,
                        paddingTop: 10,
                        flexGrow: 1
                    }}
                    initialNumToRender={15}
                    ListEmptyComponent={() => loadingHistory ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, transform: [{ scaleY: -1 }] }}>
                            <MaterialCommunityIcons name="chat-plus-outline" size={60} color={Colors.gray300} />
                            <Text style={{ color: Colors.gray500, fontSize: 16, marginTop: 10 }}>Démarrer la discussion</Text>
                        </View>
                    )}
                />
            </View>

            {/* BARRE D'ENTRÉE (INPUT) */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                <View style={[styles.inputContainer, { backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface, borderTopWidth: 1, borderColor: isDark ? Colors.dark.border : Colors.light.border, borderRadius: 18, marginHorizontal: 0, marginBottom: 10, shadowColor: Colors.primary, shadowOpacity: 0.08, shadowRadius: 8 }]}>
                    <TouchableOpacity
                        style={[styles.attachBtn, { backgroundColor: Colors.primary, borderRadius: 12, marginRight: 6 }]}
                        onPress={() => {
                            LayoutAnimation.easeInEaseOut();
                            setShowAttachMenu(!showAttachMenu);
                        }}
                    >
                        <Animated.View style={{ transform: [{ rotate: showAttachMenu ? '45deg' : '0deg' }] }}>
                            <Feather name="plus" size={24} color="#FFF" />
                        </Animated.View>
                    </TouchableOpacity>

                    <View style={[styles.textInputWrapper, { backgroundColor: isDark ? Colors.dark.surfaceVariant : Colors.gray200 }]}>
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
                            <TouchableOpacity onPress={() => setShowCamera(true)} style={[styles.camInputBtn, { backgroundColor: Colors.accent, borderRadius: 10, marginLeft: 6, padding: 6 }]}>
                                <Feather name="camera" size={20} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.mainActionWrapper}>
                        {inputText.trim().length > 0 ? (
                            <TouchableOpacity
                                style={[styles.sendButton, { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.18, shadowRadius: 8 }]}
                                onPress={() => sendMessage('text', inputText)}
                            >
                                <Ionicons name="send" size={20} color="#FFF" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.micButton, isRecordingAudio && styles.micButtonActive, { backgroundColor: Colors.accent }]}
                                onLongPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    startAudioRecording();
                                }}
                                onPressOut={() => stopAudioRecording(true)}
                            >
                                <MaterialCommunityIcons name={isRecordingAudio ? "stop" : "microphone"} size={22} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* MENU ATTACHEMENTS */}
                {showAttachMenu && (
                    <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={[styles.attachMenu, { backgroundColor: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.85)', borderRadius: 18, marginHorizontal: 10, marginBottom: 10 }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.attachScroll}>
                            <AttachItem
                                icon="image"
                                label="Galerie"
                                color={Colors.primary}
                                onPress={async () => {
                                    try {
                                        // On appelle la fonction utilitaire
                                        const imageUri = await pickImage();

                                        // Si pickImage renvoie directement le lien (string)
                                        if (imageUri && typeof imageUri === 'string') {
                                            setShowAttachMenu(false); // Ferme le menu
                                            const url = await uploadFile(imageUri, 'image');
                                            if (url) sendMessage('image', url);
                                        }
                                    } catch (error) {
                                        console.error("Erreur sélection image:", error);
                                    }
                                }}
                            />
                            <AttachItem icon="camera" label="Appareil" color={Colors.accent} onPress={() => setShowCamera(true)} />
                            <AttachItem icon="file-text" label="Document" color={Colors.secondary} onPress={async () => {
                                const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
                                if (!res.canceled) {
                                    const url = await uploadFile(res.assets[0].uri, 'files');
                                    if (url) sendMessage('file', url, { file_name: res.assets[0].name });
                                }
                            }} />
                            <AttachItem icon="map-pin" label="Lieu" color={Colors.success} onPress={() => { }} />
                        </ScrollView>
                    </BlurView>
                )}
                <View style={{ height: insets.bottom + 5 }} />
            </KeyboardAvoidingView>

            {/* MODALES (CAMÉRA, VISIONNEUSE, ETC.) à compléter si besoin */}
            {/* VISIONNEUSE D'IMAGE */}
            <Modal visible={!!selectedImage} transparent animationType="fade">
                <View style={styles.viewerContainer}>
                    <TouchableOpacity style={styles.closeViewer} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close" size={30} color="#FFF" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image source={{ uri: selectedImage }} style={styles.viewerImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>

            {/* MODALE CAMÉRA PLEIN ÉCRAN */}
            <Modal visible={showCamera} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#000' }}>
                    <CameraView
                        ref={cameraRef}
                        style={{ flex: 1 }}
                        facing={cameraType}
                        mode={isRecordingVideo ? "video" : "picture"}
                    >
                        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
                            <View style={styles.cameraHeader}>
                                <TouchableOpacity onPress={() => setShowCamera(false)}>
                                    <Ionicons name="close" size={32} color="#FFF" />
                                </TouchableOpacity>
                                {isRecordingVideo && (
                                    <View style={styles.videoTimerBox}>
                                        <View style={styles.redDot} />
                                        <Text style={styles.videoTimerText}>{formatTime(videoTimer)}</Text>
                                    </View>
                                )}
                                <TouchableOpacity onPress={() => setCameraType(t => t === 'back' ? 'front' : 'back')}>
                                    <Ionicons name="camera-reverse" size={32} color="#FFF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cameraFooter}>
                                <TouchableOpacity
                                    onLongPress={toggleVideoRecording}
                                    onPress={takePhoto}
                                    style={[styles.captureBtn, isRecordingVideo && styles.captureBtnRecording]}
                                >
                                    <View style={[styles.captureBtnInner, isRecordingVideo && { borderRadius: 8 }]} />
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </CameraView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
// --- STYLES (TRÈS DÉTAILLÉS) ---
const styles = StyleSheet.create({
    container: { flex: 1, overflow: 'hidden', bottom: -32, position: 'relative', backgroundColor: 'transparent' },
    header: {
        paddingTop: 0,
        // paddingBottom: 15,
        zIndex: 10,
        marginTop: 150,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,

    },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10 },
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
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
        marginRight: 4,
        shadowColor: Colors.primary,
        shadowOpacity: 0.13,
        shadowRadius: 8,
        elevation: 2,
    },
    theirBubble: {
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 4,
        marginLeft: 4,
        borderWidth: 0.5,
        borderColor: Colors.gray200,
        shadowColor: Colors.gray400,
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 1,
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
        // minHeight: 45
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
    uploadText: { color: '#FFF', marginTop: 15, fontWeight: '600' },
    cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    cameraFooter: { alignItems: 'center', paddingBottom: 40 },
    captureBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },
    captureBtnRecording: { borderColor: '#EF4444' },
    videoTimerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    videoTimerText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },

});