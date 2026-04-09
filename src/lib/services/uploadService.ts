import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export const uploadAvatar = async (userId: string, imageUri: string, attempts = 2): Promise<string | null> => {
  try {
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
    } as any);

    // Utilisation de multipart/form-data pour éviter "Network request failed"
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, formData, {
        contentType: 'multipart/form-data',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return publicUrl;
  } catch (error: any) {
    const msg = error?.message || String(error);

    // Gestion du Retry (Tentatives)
    if ((msg.includes('Network request failed') || msg.includes('Failed to fetch')) && attempts > 0) {
      console.warn(`[Retry] Échec réseau, tentative restante: ${attempts}`);
      await new Promise(r => setTimeout(r, 1000));
      return uploadAvatar(userId, imageUri, attempts - 1);
    }

    // Gestion Session expirée
    if (msg.includes('Refresh Token Not Found') || msg.includes('Invalid Refresh Token')) {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('supabase.auth.token');
      return null;
    }

    console.error('[Upload Error]:', msg);
    return null;
  }
};