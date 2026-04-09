import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: 'booking' | 'message' | 'review' | 'system';
  title: string;
  body: string;
  is_read: boolean;
  reservation_id?: string;
  message_id?: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  toggleNotificationRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  removeAllNotifications: () => Promise<void>;
  // Ajoutez cette ligne :
  addNotification: (notif: { type: Notification['type']; title: string; body: string }) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const addNotification = async (notif: { type: Notification['type']; title: string; body: string }) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: user.id,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          is_read: false,
        },
      ])
      .select();

    if (error) console.error("Erreur ajout notification:", error.message);
    // Note: Le useEffect avec le channel Supabase mettra à jour la liste automatiquement
  };
  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data as Notification[]);
  };

 useEffect(() => {
  if (user) {
    fetchNotifications();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Écoute INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Changement reçu :', payload.eventType);

          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification;
            // On ajoute la nouvelle notification au début du tableau
            setNotifications((current) => [newNotif, ...current]);
          } 
          
          else if (payload.eventType === 'UPDATE') {
            const updatedNotif = payload.new as Notification;
            setNotifications((current) =>
              current.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
            );
          } 
          
          else if (payload.eventType === 'DELETE') {
            // Attention : pour DELETE, l'ID est dans payload.old
            const deletedId = payload.old.id;
            setNotifications((current) => current.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [user]);

  // --- ACTIONS ---

  const toggleNotificationRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;

    const newReadStatus = !notif.is_read;

    // Mise à jour locale (Optimistic UI)
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: newReadStatus } : n))
    );

    // Mise à jour BDD
    await supabase
      .from('notifications')
      .update({ is_read: newReadStatus, read_at: new Date().toISOString() })
      .eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user) return;

    // Mise à jour locale
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    // Mise à jour BDD
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const removeNotification = async (id: string) => {
    // Suppression locale
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Suppression BDD
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) console.error("Erreur suppression:", error.message);
  };

  const removeAllNotifications = async () => {
    if (!user) return;

    // Suppression locale
    setNotifications([]);

    // Suppression BDD (Uniquement les notifications de l'utilisateur)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) console.error("Erreur suppression totale:", error.message);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toggleNotificationRead,
        markAllAsRead,
        removeNotification,
        removeAllNotifications,
        addNotification

      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};