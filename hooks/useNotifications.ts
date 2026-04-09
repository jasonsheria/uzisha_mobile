import { useEffect } from 'react';
import {
  initializeNotifications,
  requestNotificationPermissions,
  setupNotificationCategories,
  setupNotificationListeners,
} from '@/utils/notificationService';

/**
 * Hook pour initialiser les notifications expo-notifications
 */
export function useExpoNotifications() {
  useEffect(() => {
    const initializeAllNotifications = async () => {
      try {
        console.info('🔔 Initialisation des notifications...');

        // Initialiser le service
        const initialized = await initializeNotifications();
        if (!initialized) {
          console.warn('⚠️ Notifications partiellement initialisées');
        }

        // Demander les permissions
        const granted = await requestNotificationPermissions();
        if (!granted) {
          console.warn('⚠️ Permissions notifications refusées');
        }

        // Configurer les catégories/actions
        await setupNotificationCategories();

        // Configurer les listeners
        const unsubscribe = setupNotificationListeners(
          (notification) => {
            console.info('📬 Notification reçue');
          },
          (response) => {
            console.info('📤 Notification appuyée');
          }
        );

        // Cleanup on unmount
        return () => {
          unsubscribe?.();
        };
      } catch (error) {
        console.error('❌ Erreur initialisation notifications:', error);
      }
    };

    initializeAllNotifications();
  }, []);
}


