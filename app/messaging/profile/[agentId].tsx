import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Agent {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  email?: string;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Amadou Sow',
    phone: '+221 77 123 45 67',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amadou',
    email: 'amadou.sow@realestate.com',
  },
  {
    id: '2',
    name: 'Marie Diallo',
    phone: '+221 78 987 65 43',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    email: 'marie.diallo@realestate.com',
  },
  {
    id: '3',
    name: 'Jean Kouassi',
    phone: '+225 07 123 45 67',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
    email: 'jean.kouassi@realestate.com',
  },
  {
    id: '4',
    name: 'Kofi Mensah',
    phone: '+233 24 123 45 67',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kofi',
    email: 'kofi.mensah@realestate.com',
  },
  {
    id: '5',
    name: 'Chioma Okafor',
    phone: '+234 81 123 45 67',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chioma',
    email: 'chioma.okafor@realestate.com',
  },
  {
    id: '6',
    name: 'Aïssatou Ba',
    phone: '+226 76 123 45 67',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aissatou',
    email: 'aissatou.ba@realestate.com',
  },
];

export default function AgentProfileScreen() {
  const router = useRouter();
  const { agentId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getStyles(isDark);

  const [agent, setAgent] = useState<Agent | null>(null);

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [router])
  );

  useEffect(() => {
    const foundAgent = MOCK_AGENTS.find((a: Agent) => a.id === agentId);
    setAgent(foundAgent || null);
  }, [agentId]);

  const handleCall = () => {
    if (agent?.phone) {
      Linking.openURL(`tel:${agent.phone}`);
    }
  };

  const handleEmail = () => {
    if (agent?.email) {
      Linking.openURL(`mailto:${agent.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (agent?.phone) {
      const message = 'Bonjour, je suis intéressé par vos propriétés.';
      Linking.openURL(`https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`);
    }
  };

  if (!agent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : Colors.white }]}>
        <Text style={styles.errorText}>Agent non trouvé</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Colors.dark.background : Colors.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={isDark ? Colors.dark.text : '#0F172A'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          {agent.avatar ? (
            <Image source={{ uri: agent.avatar }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <MaterialCommunityIcons name="account" size={80} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Agent Info */}
        <View style={styles.infoSection}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentTitle}>Agent Immobilier</Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Coordonnées</Text>

          {/* Phone */}
          <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
            <View style={styles.contactIconContainer}>
              <MaterialCommunityIcons name="phone" size={20} color="#06B6D4" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Téléphone</Text>
              <Text style={styles.contactValue}>{agent.phone}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={isDark ? '#64748B' : '#94A3B8'}
            />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
            <View style={styles.contactIconContainer}>
              <MaterialCommunityIcons name="email" size={20} color="#06B6D4" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{agent.email}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={isDark ? '#64748B' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <MaterialCommunityIcons name="phone" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Appeler</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleWhatsApp}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.emailButton]} onPress={handleEmail}>
            <MaterialCommunityIcons name="email" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.aboutText}>
            Agent immobilier expérimenté spécialisé dans la vente et la location de propriétés premium en Afrique de l'Ouest. 
            Disponible pour vous aider à trouver la propriété parfaite.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>250+</Text>
            <Text style={styles.statLabel}>Propriétés</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Évaluation</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
        </View>

        {/* Message Button */}
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => {
            router.push({
              pathname: '/messaging/[agentId]' as any,
              params: { agentId: agent.id },
            });
          }}
        >
          <MaterialCommunityIcons name="message" size={20} color="#FFFFFF" />
          <Text style={styles.messageButtonText}>Retour à la Conversation</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? Colors.dark.background : Colors.white,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(226, 232, 240, 0.6)',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.8)',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : '#0F172A',
      letterSpacing: -0.3,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      gap: 20,
    },
    profilePictureContainer: {
      alignItems: 'center',
      marginVertical: 12,
    },
    profilePicture: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 3,
      borderColor: '#06B6D4',
      backgroundColor: '#E0F7FA',
    },
    profilePicturePlaceholder: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: '#06B6D4',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'rgba(6, 182, 212, 0.3)',
    },
    infoSection: {
      alignItems: 'center',
      gap: 6,
    },
    agentName: {
      fontSize: 24,
      fontWeight: '800',
      color: isDark ? Colors.dark.text : '#0F172A',
      letterSpacing: -0.5,
    },
    agentTitle: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : Colors.gray500,
      fontWeight: '600',
    },
    contactSection: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? Colors.dark.text : '#0F172A',
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)',
      borderRadius: 12,
      gap: 12,
    },
    contactIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(6, 182, 212, 0.2)',
    },
    contactInfo: {
      flex: 1,
      gap: 2,
    },
    contactLabel: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : Colors.gray500,
      fontWeight: '500',
    },
    contactValue: {
      fontSize: 14,
      color: isDark ? Colors.dark.text : '#0F172A',
      fontWeight: '600',
    },
    actionSection: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: '#06B6D4',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      flexDirection: 'row',
    },
    whatsappButton: {
      backgroundColor: '#25D366',
    },
    emailButton: {
      backgroundColor: '#EA4335',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    aboutSection: {
      gap: 8,
    },
    aboutText: {
      fontSize: 14,
      color: isDark ? '#94A3B8' : Colors.gray500,
      lineHeight: 21,
      fontWeight: '500',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 12,
    },
    statItem: {
      flex: 1,
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.6)',
      borderRadius: 12,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.5)',
    },
    statNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: '#06B6D4',
      letterSpacing: -0.3,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#94A3B8' : Colors.gray500,
      fontWeight: '600',
    },
    messageButton: {
      flexDirection: 'row',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: '#06B6D4',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
    messageButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    errorText: {
      color: isDark ? Colors.dark.text : '#0F172A',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 20,
    },
  });
