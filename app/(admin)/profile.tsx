import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
// import { sendImmediateNotification } from '@/utils/notificationService';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/utils/supabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { pickImage, uploadAvatarImage } from '@/utils/uploadService';
import { authService } from '@/utils/authService';

export default function profile() {
  const { addNotification } = useNotifications();
  const { logout, user, updateUser } = useAuthContext();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const [userName, setUserName] = useState(user?.name || 'Agent Partenaire');
  const [userEmail] = useState(user?.email || 'agent@emobilier.com');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<'name' | 'password' | null>(null);
  const [newName, setNewName] = useState(userName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Avatar update logic
  const handleUpdateAvatar = async () => {
    setLoading(true);
    try {
      const imageUri = await pickImage();
      if (!imageUri || !user) {
        setLoading(false);
        return;
      }
      const uploadedUrl = await uploadAvatarImage(imageUri, user.id);
      if (!uploadedUrl) {
        setLoading(false);
        Alert.alert('Erreur', "Impossible d'uploader l'avatar");
        return;
      }
      // Update profile in Supabase
      const updatedUser = await authService.updateUserProfile(user.id, { avatar: uploadedUrl });
      if (updatedUser) {
        setAvatarUrl(uploadedUrl);
        updateUser(updatedUser);
        Alert.alert('Succès', 'Votre avatar a été mis à jour');
      } else {
        Alert.alert('Erreur', "Impossible de mettre à jour l'avatar");
      }
    } catch (error) {
      Alert.alert('Erreur', "Erreur lors de l'upload de l'avatar");
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = async () => {
    if (!newName.trim() || !user) {
      Alert.alert('Erreur', 'Veuillez entrer un nom valide');
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await authService.updateUserProfile(user.id, { name: newName });
      if (updatedUser) {
        setUserName(updatedUser.name);
        updateUser(updatedUser);
        Alert.alert('Succès', 'Votre nom a été mis à jour');
        setShowEditModal(false);
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour votre nom');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre nom');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel');
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nouveau mot de passe');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit avoir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Notifications
      // await sendImmediateNotification(
      //   'Mot de passe modifié',
      //   'Votre mot de passe a été changé avec succès.',
      //   'default',
      //   { email: userEmail }
      // );

      addNotification({
        type: 'system',
        title: 'Mot de passe modifié',
        body: 'Votre mot de passe a été changé. Un email de confirmation a été envoyé.',
      });

      // 1. Fermer le modal et arrêter le loading AVANT l'alerte
      setShowEditModal(false);
      setLoading(false); // <--- Très important d'arrêter ici

      // 2. Utiliser le bouton de l'alerte pour rediriger
      Alert.alert(
        'Succès',
        'Votre mot de passe a été changé. Vous allez être déconnecté pour des raisons de sécurité.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/login');
            }
          }
        ],
        { cancelable: false }
      );

    } catch (error: any) {
      setLoading(false);
      Alert.alert('Erreur', error.message || 'Impossible de changer votre mot de passe');
    }
  };
  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Tous vos données seront supprimées.',
      [
        { text: 'Annuler', onPress: () => { } },
        {
          text: 'Supprimer',
          onPress: () => {
            Alert.prompt(
              'Confirmation',
              'Tapez votre email pour confirmer la suppression',
              [
                { text: 'Annuler', onPress: () => { } },
                {
                  text: 'Supprimer',
                  onPress: (email: any) => {
                    if (email === userEmail) {
                      setLoading(true);
                      setTimeout(() => {
                        router.replace('/(tabs)');
                        Alert.alert('Info', 'Votre compte a été supprimé');
                      }, 1500);
                    } else {
                      Alert.alert('Erreur', 'Email incorrect');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter?', [
      { text: 'Annuler', onPress: () => { } },
      {
        text: 'Déconnecter',
        onPress: async () => {
          await logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
          <TouchableOpacity onPress={handleUpdateAvatar} style={[styles.avatar, { backgroundColor: '#06B6D4' }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64, borderRadius: 32 }} />
            ) : (
              <MaterialCommunityIcons name="account" size={40} color="#FFFFFF" />
            )}
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#06B6D4', borderRadius: 12, padding: 2 }}>
              <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {userEmail}
            </Text>
          </View>
        </View>

        {/* Profile Settings Section */}
        <View>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
            Paramètres du Compte
          </Text>

          {/* Edit Name */}
          <TouchableOpacity
            style={[
              styles.settingCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              },
            ]}
            onPress={() => {
              setEditField('name');
              setShowEditModal(true);
            }}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="pencil" size={20} color="#06B6D4" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Modifier le nom
                </Text>
                <Text style={[styles.settingSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  {userName}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#06B6D4" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={[
              styles.settingCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              },
            ]}
            onPress={() => {
              setEditField('password');
              setShowEditModal(true);
            }}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#F59E0B" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Changer le mot de passe
                </Text>
                <Text style={[styles.settingSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Mise à jour regulière recommandée
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View>
          <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
            Zone Dangereuse
          </Text>

          {/* Logout */}
          <TouchableOpacity
            style={[
              styles.settingCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              },
            ]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="logout" size={20} color="#FBBF24" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Se déconnecter
                </Text>
                <Text style={[styles.settingSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Terminer votre session
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FBBF24" />
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={[
              styles.settingCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              },
            ]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                  Supprimer le compte
                </Text>
                <Text style={[styles.settingSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Cette action est irréversible
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
          <MaterialCommunityIcons name="information" size={20} color="#06B6D4" />
          <Text style={[styles.infoText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Pour des raisons de sécurité, vous devrez vous reconnecter après certaines modifications.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        onRequestClose={() => {
          setShowEditModal(false);
          setEditField(null);
        }}
        transparent
        animationType="slide"
      >
        <SafeAreaView
          style={[styles.modal, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditField(null);
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#06B6D4" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                {editField === 'name' ? 'Modifier le nom' : 'Changer le mot de passe'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Edit Name Form */}
            {editField === 'name' && (
              <View style={styles.formContainer}>
                <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  Nouveau nom
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                      color: isDark ? '#F1F5F9' : '#0F172A',
                    },
                  ]}
                  placeholder="Entrez votre nouveau nom"
                  placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                  value={newName}
                  onChangeText={setNewName}
                />

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: loading ? '#94A3B8' : '#06B6D4' }]}
                  onPress={handleEditName}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Change Password Form */}
            {editField === 'password' && (
              <View style={styles.formContainer}>
                {/* Current Password */}
                <View>
                  <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    Mot de passe actuel
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          color: isDark ? '#F1F5F9' : '#0F172A',
                        },
                      ]}
                      placeholder="Entrez votre mot de passe"
                      placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                      secureTextEntry={!showPassword}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />
                  </View>
                </View>

                {/* New Password */}
                <View>
                  <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    Nouveau mot de passe
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          color: isDark ? '#F1F5F9' : '#0F172A',
                        },
                      ]}
                      placeholder="Entrez un nouveau mot de passe"
                      placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                </View>

                {/* Confirm Password */}
                <View>
                  <Text style={[styles.formLabel, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                    Confirmer le mot de passe
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                          color: isDark ? '#F1F5F9' : '#0F172A',
                        },
                      ]}
                      placeholder="Confirmez le mot de passe"
                      placeholderTextColor={isDark ? '#64748B' : '#CBD5E1'}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#06B6D4"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: loading ? '#94A3B8' : '#06B6D4' }]}
                  onPress={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Changer le mot de passe</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#06B6D4" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  modal: {
    flex: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formContainer: {
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
