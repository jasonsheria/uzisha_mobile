import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { supabase } from '@/utils/supabase';

/**
 * Sélectionner une image depuis la galerie du téléphone
 */
export const pickImage = async (): Promise<string | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('[Pick Image Error]:', error);
    return null;
  }
};

/**
 * Sélectionner une vidéo depuis la galerie du téléphone
 */
export const pickVideo = async (): Promise<string | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('[Pick Video Error]:', error);
    return null;
  }
};


/**
 * Uploader une image d'avatar vers Supabase Storage (bucket: avatars)
 */
export const uploadAvatarImage = async (
  imageUri: string,
  userId: string,
  attempts = 2
): Promise<string | null> => {
  try {
    // Obtenir l'information du fichier
    const fileInfo = await getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Extraire l'extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Lire le fichier en base64
    const base64 = await readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    // Upload vers Supabase Storage (bucket: avatars)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('[Upload Success] Avatar uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('[Upload Avatar Error]:', msg);

    // Retry logique
    if ((msg.includes('Network') || msg.includes('Failed to fetch')) && attempts > 0) {
      console.warn(`[Retry] Retrying avatar... (${attempts} attempts left)`);
      await new Promise((r) => setTimeout(r, 1000));
      return uploadAvatarImage(imageUri, userId, attempts - 1);
    }

    return null;
  }
};

/**
 * Uploder une image vers Supabase Storage (photos de propriétés)
 */
export const uploadPropertyImage = async (
  imageUri: string,
  articleId: string,
  attempts = 2
): Promise<string | null> => {
  try {
    // Obtenir l'information du fichier
    const fileInfo = await getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Extraire l'extension
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `properties/${articleId}/${fileName}`;

    // Lire le fichier en base64
    const base64 = await readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    // Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    console.log('[Upload Success] Image uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('[Upload Image Error]:', msg);

    // Retry logique
    if ((msg.includes('Network') || msg.includes('Failed to fetch')) && attempts > 0) {
      console.warn(`[Retry] Retrying... (${attempts} attempts left)`);
      await new Promise((r) => setTimeout(r, 1000));
      return uploadPropertyImage(imageUri, articleId, attempts - 1);
    }

    return null;
  }
};

/**
 * Upload une vidéo vers Supabase Storage
 */
export const uploadPropertyVideo = async (
  videoUri: string,
  articleId: string,
  attempts = 2
): Promise<string | null> => {
  try {
    const fileInfo = await getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const fileExt = videoUri.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `properties/${articleId}/videos/${fileName}`;

    const base64 = await readAsStringAsync(videoUri, {
      encoding: 'base64' as any,
    });

    const { error: uploadError } = await supabase.storage
      .from('property-videos')
      .upload(filePath, decode(base64), {
        contentType: `video/${fileExt}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('property-videos')
      .getPublicUrl(filePath);

    console.log('[Upload Success] Video uploaded:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error('[Upload Video Error]:', msg);

    if ((msg.includes('Network') || msg.includes('Failed to fetch')) && attempts > 0) {
      console.warn(`[Retry] Retrying video... (${attempts} attempts left)`);
      await new Promise((r) => setTimeout(r, 1000));
      return uploadPropertyVideo(videoUri, articleId, attempts - 1);
    }

    return null;
  }
};

/**
 * Utility pour convertir base64 en Uint8Array
 */
const decode = (base64: string): Uint8Array => {
  const binaryString = global.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Upload plusieurs images en parallèle
 */
export const uploadMultipleImages = async (
  imageUris: string[],
  articleId: string
): Promise<string[]> => {
  try {
    const uploadPromises = imageUris.map((uri) =>
      uploadPropertyImage(uri, articleId)
    );
    const results = await Promise.all(uploadPromises);
    return results.filter((url) => url !== null) as string[];
  } catch (error) {
    console.error('[Upload Multiple Error]:', error);
    return [];
  }
};

/**
 * Upload plusieurs vidéos en parallèle
 */
export const uploadMultipleVideos = async (
  videoUris: string[],
  articleId: string
): Promise<string[]> => {
  try {
    const uploadPromises = videoUris.map((uri) =>
      uploadPropertyVideo(uri, articleId)
    );
    const results = await Promise.all(uploadPromises);
    return results.filter((url) => url !== null) as string[];
  } catch (error) {
    console.error('[Upload Multiple Videos Error]:', error);
    return [];
  }

  
};
/**
 * Uploader un asset de boutique (Logo ou Cover) vers Supabase Storage
 */
export const uploadShopAsset = async (
  imageUri: string,
  userId: string,
  type: 'logo' | 'image',
  attempts = 2
): Promise<string | null> => {
  try {
    const fileInfo = await getInfoAsync(imageUri);
    if (!fileInfo.exists) throw new Error('File does not exist');

    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    // Organisation : shop-assets/id_utilisateur/logo_timestamp.jpg
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const base64 = await readAsStringAsync(imageUri, {
      encoding: 'base64' as any,
    });

    const { error: uploadError } = await supabase.storage
      .from('shop-assets') // Assurez-vous que ce bucket existe dans Supabase
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('shop-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error: any) {
    const msg = error?.message || String(error);
    console.error(`[Upload Shop ${type} Error]:`, msg);

    if ((msg.includes('Network') || msg.includes('Failed to fetch')) && attempts > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return uploadShopAsset(imageUri, userId, type, attempts - 1);
    }
    return null;
  }
};
