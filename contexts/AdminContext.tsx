import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';

// --- Interfaces (Inchangées) ---
export interface AdminArticle {
  id: string; title: string; type: 'house' | 'apartment' | 'land' | 'restaurant' | 'event-space' | 'gym' | 'supermarket';
  listingType: 'sale' | 'rental'; price: number; visitPrice: number; location: string; description: string;
  image: string; images?: string[]; videos?: string[]; beds?: number; baths?: number; area?: number;
  parking_spaces?: number; living_area?: number; kitchen_area?: number; features?: string[];
  userId?: string; createdAt: string; details?: Record<string, any>;
}

export interface ReservationRequest {
  id: string; propertyId: string; propertyTitle: string; clientName: string; clientEmail: string;
  clientPhone: string; requestedDate: string; status: 'pending' | 'confirmed' | 'cancelled'; createdAt: string;
}

export interface AdminCalendar {
  date: string; isAvailable: boolean;
  slots?: { time: string; available: boolean; }[];
}

export interface AdminSubscription {
  id: string; plan: 'basic' | 'premium' | 'elite'; status: 'active' | 'expired' | 'cancelled';
  startDate: string; endDate: string; price: number; paymentMethod?: 'card' | 'mobile-money';
  cardLast4?: string; expiryDate?: string;
}

export interface Users {
  id : string; name : string; avatar : string; phone : string; adresse : string; email : string; isCertified : boolean
}

interface AdminContextType {
  articles: AdminArticle[]; reservations: ReservationRequest[]; calendar: AdminCalendar[];
  setReservations: React.Dispatch<React.SetStateAction<ReservationRequest[]>>;
  subscription: AdminSubscription | null; loading: boolean; users : Users[];
  addArticle: (article: Omit<AdminArticle, 'id' | 'createdAt'>) => Promise<AdminArticle | null>;
  updateArticle: (id: string, updates: Partial<AdminArticle>) => Promise<boolean>;
  deleteArticle: (id: string) => Promise<boolean>;
  loadArticles: () => Promise<void>;
  addReservation: (reservation: ReservationRequest) => void;
  confirmReservation: (id: string) => void;
  cancelReservation: (id: string) => void;
  setCalendarAvailability: (date: string, isAvailable: boolean) => void;
  updateSubscription: (subscription: Partial<AdminSubscription>) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Users[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [reservations, setReservations] = useState<ReservationRequest[]>([]);
  const [calendar, setCalendar] = useState<AdminCalendar[]>([]);
  const [subscription, setSubscription] = useState<AdminSubscription>({
    id: '1', plan: 'basic', status: 'active', startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), price: 29.99,
  });
  const [loading, setLoading] = useState(false);

  // 🔥 LOGIQUE DE SURVEILLANCE DES CONNEXIONS
  useEffect(() => {
    console.log('--- [ADMIN_FLOW] Changement d\'état Auth détecté ---');
    console.log('[ADMIN_FLOW] User ID actuel:', user?.id || 'NON CONNECTÉ');

    if (user) {
      console.log('[ADMIN_FLOW] Lancement de la récupération des données pour cet utilisateur...');
      loadArticles();
      loadReservations();
      getAllUsers();
    } else {
      console.log('[ADMIN_FLOW] Pas d\'utilisateur détecté, les listes restent vides.');
    }
  }, [user]);

  const getAllUsers = async () => {
    try {
      console.log('[DEBUG USERS] Tentative de récupération des utilisateurs...');
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('[DEBUG USERS] Erreur Supabase:', error.message);
        return;
      }
      console.log(`[DEBUG USERS] Succès: ${data?.length || 0} utilisateurs trouvés.`);
      setUsers(data);
    } catch (error) {
      console.error('[DEBUG USERS] Exception:', error);
    }
  };

  const loadReservations = async () => {
    console.log('--- [DEBUG RESERVATIONS] Début chargement ---');
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`*, properties!inner(title, price, type, location, user_id)`)
        .eq('properties.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DEBUG RESERVATIONS] Erreur:', error.message);
        throw error;
      }

      console.log(`[DEBUG RESERVATIONS] Succès: ${data?.length || 0} réservations pour le user ${user?.id}`);

      const formatted: ReservationRequest[] = data.map((res: any) => ({
        id: res.id,
        propertyId: res.property_id,
        propertyTitle: res.properties.title,
        clientName: res.client_name,
        clientEmail: res.client_email,
        clientPhone: res.client_phone,
        requestedDate: res.requested_date,
        status: res.status,
        createdAt: res.created_at,
      }));

      setReservations(formatted);
    } catch (error) {
      console.error('[DEBUG RESERVATIONS] Exception fatale:', error);
    } finally {
      setLoading(false);
      console.log('--- [DEBUG RESERVATIONS] Fin ---');
    }
  };

  const loadArticles = async () => {
    console.log('--- [DEBUG ARTICLES] Début chargement ---');
    try {
      setLoading(true);
      
      // Verification cruciale : Supabase a-t-il le jeton ?
      const { data: sessionInfo } = await supabase.auth.getSession();
      console.log('[DEBUG ARTICLES] Session client Supabase active ?', !!sessionInfo.session);
      console.log('[DEBUG ARTICLES] Appel table "properties" pour user_id:', user?.id);

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[DEBUG ARTICLES] Erreur Supabase:', error.message, '| Code:', error.code);
        return;
      }

      console.log(`[DEBUG ARTICLES] Succès: ${data?.length || 0} propriétés trouvées.`);

      const formattedArticles: AdminArticle[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        listingType: item.listing_type,
        price: item.price,
        visitPrice: item.visit_price || 0,
        location: item.location,
        description: item.description || '',
        image: item.image,
        images: item.images || [],
        videos: item.videos || [],
        beds: item.beds,
        baths: item.baths,
        area: item.area,
        parking_spaces: item.parking_spaces,
        living_area: item.living_area,
        kitchen_area: item.kitchen_area,
        features: item.features || [],
        userId: item.user_id,
        createdAt: item.created_at,
        details: item.details || {},
        visibility: item.visibility || 'active',
      }));

      setArticles(formattedArticles);
    } catch (error) {
      console.error('[DEBUG ARTICLES] Exception fatale:', error);
    } finally {
      setLoading(false);
      console.log('--- [DEBUG ARTICLES] Fin ---');
    }
  };

  // --- Fonctions CRUD (Inchangées mais prêtes pour logs) ---
  const addArticle = async (articleData: Omit<AdminArticle, 'id' | 'createdAt'>) => {
    console.log('[CRUD] Tentative d\'ajout article...');
    try {
      if (!user?.id) return null;
      const { data, error } = await supabase.from('properties').insert([{
            user_id: user.id, title: articleData.title, type: articleData.type,
            listing_type: articleData.listingType, price: articleData.price,
            visit_price: articleData.visitPrice, location: articleData.location,
            description: articleData.description, image: articleData.image,
            images: articleData.images || [], videos: articleData.videos || [],
            beds: articleData.beds, baths: articleData.baths, area: articleData.area,
            parking_spaces: articleData.parking_spaces, living_area: articleData.living_area,
            kitchen_area: articleData.kitchen_area, features: articleData.features || [],
            details: articleData.details || {},
      }]).select().single();

      if (error) throw error;
      setArticles([data, ...articles]);
      return data;
    } catch (e) { console.error('[CRUD] Erreur ajout:', e); return null; }
  };

  const updateArticle = async (id: string, updates: Partial<AdminArticle>) => {
    if (!user?.id) return false;
    const { error } = await supabase.from('properties').update(updates).eq('id', id).eq('user_id', user.id);
    if (!error) loadArticles();
    return !error;
  };

  const deleteArticle = async (id: string) => {
    if (!user?.id) return false;
    const { error } = await supabase.from('properties').delete().eq('id', id).eq('user_id', user.id);
    if (!error) setArticles(articles.filter(a => a.id !== id));
    return !error;
  };

  const addReservation = (res: ReservationRequest) => setReservations([...reservations, res]);
  const confirmReservation = (id: string) => setReservations(reservations.map(r => r.id === id ? { ...r, status: 'confirmed' } : r));
  const cancelReservation = (id: string) => setReservations(reservations.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));

  const setCalendarAvailability = (date: string, isAvailable: boolean) => {
    if (!user?.id) return;
    supabase.from('admin_availability').upsert([{ admin_id: user.id, date, is_available: isAvailable }]).then(({error}) => {
      if (!error) setCalendar(prev => [...prev.filter(c => c.date !== date), { date, isAvailable }]);
    });
  };

  const updateSubscription = (updates: Partial<AdminSubscription>) => {
    setSubscription(subscription ? { ...subscription, ...updates } : subscription);
  };

  return (
    <AdminContext.Provider
      value={{
        articles, reservations, calendar, subscription, loading, users,
        addArticle, updateArticle, deleteArticle, loadArticles,
        addReservation, confirmReservation, cancelReservation,
        setReservations, setCalendarAvailability, updateSubscription,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};