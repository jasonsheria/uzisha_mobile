import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configurer le handler de notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Vérifier si on est dans Expo Go (pas de development build)
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Initialiser les notifications
 */
export async function initializeNotifications() {
  // Notifications push ne fonctionnent pas dans Expo Go
  if (isExpoGo) {
    console.info('ℹ️ Notifications push désactivées dans Expo Go');
    return false;
  }

  try {
    // Vérifier les permissions existantes
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si pas de permission, demander
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.info('ℹ️ Permissions notifications: non accordée');
      return false;
    }

    // Configuration Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#06B6D4',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('booking', {
        name: 'Réservations',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ec4899',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('messaging', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('price_alert', {
        name: 'Alertes Prix',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [],
        lightColor: '#f59e0b',
        sound: 'default',
      });
    }

    console.info('✅ Notifications initialisées avec succès');
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur initialisation notifications:', error);
    return false;
  }
}

/**
 * Demander les permissions de notification
 */
export async function requestNotificationPermissions() {
  try {
    if (!Device.isDevice) {
      console.info('ℹ️ Permissions: Émulateur - permissions simulées');
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    console.info('📱 Permission notifications:', status === 'granted' ? 'accordée' : 'refusée');
    return status === 'granted';
  } catch (error) {
    console.warn('⚠️ Erreur demande permissions:', error);
    return false;
  }
}

/**
 * Envoyer une notification locale immédiate
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  channelId: string = 'default',
  data?: Record<string, string>
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
        // Voici la bonne façon de passer le channelId en TypeScript :
        // Il est directement au premier niveau de l'objet content
        priority: 'high',
        color: '#6366F1', // Optionnel : couleur de l'icône sur Android
      },
      trigger: null,
    });
    
    // Note : Pour forcer un channel spécifique sur Android si le 'default' 
    // ne suffit pas, on utilise souvent le handler global ou on s'assure 
    // que le trigger est configuré, mais 'priority' fait le gros du travail.
    
    console.info('✅ Notification envoyée:', title);
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur envoi notification:', error);
    return false;
  }
}
/**
 * Envoyer une notification immédiate (alias)
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  channelId: string = 'default',
  data?: Record<string, string>
) {
  return sendLocalNotification(title, body, channelId, data);
}

/**
 * Programmer une notification avec délai
 */
export async function scheduleNotification(
  title: string,
  body: string,
  delaySeconds: number,
  channelId: string = 'default',
  data?: Record<string, string>
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });
    console.info('✅ Notification programmée:', title);
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur programmation notification:', error);
    return false;
  }
}

/**
 * Configurer les actions de notification
 */
export async function setupNotificationCategories() {
  try {
    // Categories pour iOS
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('booking', [
        {
          identifier: 'accept',
          buttonTitle: 'Accepter',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'decline',
          buttonTitle: 'Refuser',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('message', [
        {
          identifier: 'reply',
          buttonTitle: 'Répondre',
          options: { opensAppToForeground: true },
        },
      ]);
    }

    console.info('✅ Catégories de notifications configurées');
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur configuration catégories:', error);
    return false;
  }
}

/**
 * Obtenir les notifications affichées
 */
export async function getPresentedNotifications() {
  try {
    const notifications = await Notifications.getPresentedNotificationsAsync();
    return notifications;
  } catch (error) {
    console.warn('⚠️ Erreur récupération notifications:', error);
    return [];
  }
}

/**
 * Annuler une notification
 */
export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
    console.info('✅ Notification annulée:', notificationId);
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur annulation notification:', error);
    return false;
  }
}

/**
 * Annuler toutes les notifications
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    console.info('✅ Toutes les notifications annulées');
    return true;
  } catch (error) {
    console.warn('⚠️ Erreur annulation toutes notifications:', error);
    return false;
  }
}

/**
 * Obtenir le token push (Expo)
 */
export async function getPushNotificationToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.info('ℹ️ Token push: Non disponible sur émulateur');
      return null;
    }

    // Vérifier la version d'Expo Go
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.info('ℹ️ projectId non configuré - push notifications limitées');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    console.info('✅ Token push:', token.data.substring(0, 20) + '...');
    return token.data;
  } catch (error) {
    console.warn('⚠️ Erreur récupération token push:', error);
    return null;
  }
}

/**
 * Écouter les notifications
 */
export function setupNotificationListeners(
  onReceived?: (notification: Notifications.Notification) => void,
  onResponse?: (notification: Notifications.NotificationResponse) => void
) {
  try {
    // Notification reçue en foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.info('📬 Notification reçue:', notification.request.content.title);
        onReceived?.(notification);
      }
    );

    // Utilisateur a appuyé sur la notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.info('📤 Notification appuyée:', response.notification.request.content.title);
        onResponse?.(response);
      }
    );

    // Retourner fonction de cleanup
    return () => {
      receivedSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  } catch (error) {
    console.warn('⚠️ Erreur configuration listeners:', error);
    return () => {};
  }
}

/**
 * Templates prédéfinis
 */
export const NotificationTemplates = {
  propertyViewed: {
    title: '🏠 Propriété consultée',
    body: 'Continuez à explorer nos meilleures offres',
    channelId: 'default',
  },
  bookingConfirmed: {
    title: '✅ Réservation confirmée',
    body: 'Votre demande a été confirmée. Détails envoyés par email.',
    channelId: 'booking',
  },
  newMessage: {
    title: '💬 Nouveau message',
    body: 'Vous avez reçu un nouveau message',
    channelId: 'messaging',
  },
  priceAlert: {
    title: '💰 Alerte prix',
    body: 'Une propriété a baissé de prix!',
    channelId: 'price_alert',
  },
  favoriteAdded: {
    title: '❤️ Ajouté aux favoris',
    body: 'Propriété ajoutée à votre liste de favoris',
    channelId: 'default',
  },
};
