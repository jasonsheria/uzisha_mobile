import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface AdminArticle {
  id: string;
  title: string;
  type: 'house' | 'apartment' | 'land' | 'restaurant' | 'event-space' | 'gym' | 'supermarket';
  listingType: 'sale' | 'rental';
  price: number;
  visitPrice: number;
  location: string;
  description: string;
  image: string;
  images?: string[];
  videos?: string[];
  beds?: number;
  baths?: number;
  area?: number;
  parking_spaces?: number;
  living_area?: number;
  kitchen_area?: number;
  features?: string[];
  userId?: string;
  createdAt: string;
  details?: Record<string, any>;
}

export interface ReservationRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  requestedDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface AdminCalendar {
  date: string;
  isAvailable: boolean;
  slots?: {
    time: string;
    available: boolean;
  }[];
}

export interface AdminSubscription {
  id: string;
  plan: 'basic' | 'premium' | 'elite';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  price: number;
  paymentMethod?: 'card' | 'mobile-money';
  cardLast4?: string;
  expiryDate?: string;
}
export interface Users {
  id : string;
  name : string;
  avatar : string;
  phone : string;
  adresse : string;
  email : string;
  isCertified : boolean
}

interface AdminContextType {
  articles: AdminArticle[];
  reservations: ReservationRequest[];
  calendar: AdminCalendar[];
  setReservations: React.Dispatch<React.SetStateAction<ReservationRequest[]>>; // <--- Ajoutez cette ligne
  subscription: AdminSubscription | null;
  loading: boolean;
  users : Users[];

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
    id: '1',
    plan: 'basic',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    price: 29.99,
  });
  const [loading, setLoading] = useState(false);

  // Charger les articles depuis Supabase
  useEffect(() => {
    if (!user?.id) return;
    loadArticles();
    getAllUsers();
    loadReservations(); // <--- Ajoutez ceci
  }, [user?.id]);
  const getAllUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) {
        console.error('[impossible d\'afficher les propriétaires]:', error);
        return;
      }
      setUsers(data);
    }
    catch (error) {
      console.error('[impossible d\'afficher les propriétaires]:', error);
    } finally {
      setLoading(false);
    }
  }
  const loadReservations = async () => {
  try {
    setLoading(true);
    // On récupère les réservations. 
    // Note: On suppose que votre table s'appelle 'reservations'
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        properties!inner(title, price, type, location)
      `)
      .eq('properties.user_id', user?.id) // Filtre pour ne voir que les réservations de MES biens
      .order('created_at', { ascending: false });

    if (error) throw error;

    // On formate les données pour correspondre à votre interface
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
      // On injecte les données du bien récupérées via la jointure
      price: res.properties.price, 
      type: res.properties.listing_type === 'sale' ? 'purchase' : 'booking'
    }));

    setReservations(formatted);
  } catch (error) {
    console.error('[Load Reservations Error]:', error);
  } finally {
    setLoading(false);
  }
};
  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[Load Articles Error]:', error);
        return;
      }

      // Transformer les données Supabase en AdminArticle
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
      }));

      setArticles(formattedArticles);
    } catch (error) {
      console.error('[Load Articles Exception]:', error);
    } finally {
      setLoading(false);
    }
  };

  // Créer un article
  const addArticle = async (articleData: Omit<AdminArticle, 'id' | 'createdAt'>) => {
    try {
      if (!user?.id) {
        console.error('User not authenticated');
        return null;
      }

      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            user_id: user.id,
            title: articleData.title,
            type: articleData.type,
            listing_type: articleData.listingType,
            price: articleData.price,
            visit_price: articleData.visitPrice,
            location: articleData.location,
            description: articleData.description,
            image: articleData.image,
            images: articleData.images || [],
            videos: articleData.videos || [],
            beds: articleData.beds,
            baths: articleData.baths,
            area: articleData.area,
            parking_spaces: articleData.parking_spaces,
            living_area: articleData.living_area,
            kitchen_area: articleData.kitchen_area,
            features: articleData.features || [],
            details: articleData.details || {},
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('[Add Article Error]:', error);
        return null;
      }

      // Transformer la réponse
      const newArticle: AdminArticle = {
        id: data.id,
        title: data.title,
        type: data.type,
        listingType: data.listing_type,
        price: data.price,
        visitPrice: data.visit_price || 0,
        location: data.location,
        description: data.description || '',
        image: data.image,
        images: data.images || [],
        videos: data.videos || [],
        beds: data.beds,
        baths: data.baths,
        area: data.area,
        parking_spaces: data.parking_spaces,
        living_area: data.living_area,
        kitchen_area: data.kitchen_area,
        features: data.features || [],
        userId: data.user_id,
        createdAt: data.created_at,
        details: data.details || {},
      };

      // Mettre à jour l'état local
      setArticles([newArticle, ...articles]);
      console.log('[Add Article Success]:', newArticle.id);
      return newArticle;
    } catch (error) {
      console.error('[Add Article Exception]:', error);
      return null;
    }
  };

  // Mettre à jour un article
  const updateArticle = async (id: string, updates: Partial<AdminArticle>) => {
    try {
      if (!user?.id) return false;

      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.type) updateData.type = updates.type;
      if (updates.listingType) updateData.listing_type = updates.listingType;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.visitPrice !== undefined) updateData.visit_price = updates.visitPrice;
      if (updates.location) updateData.location = updates.location;
      if (updates.description) updateData.description = updates.description;
      if (updates.image) updateData.image = updates.image;
      if (updates.images) updateData.images = updates.images;
      if (updates.videos) updateData.videos = updates.videos;
      if (updates.beds !== undefined) updateData.beds = updates.beds;
      if (updates.baths !== undefined) updateData.baths = updates.baths;
      if (updates.area !== undefined) updateData.area = updates.area;
      if (updates.parking_spaces !== undefined) updateData.parking_spaces = updates.parking_spaces;
      if (updates.living_area !== undefined) updateData.living_area = updates.living_area;
      if (updates.kitchen_area !== undefined) updateData.kitchen_area = updates.kitchen_area;
      if (updates.features) updateData.features = updates.features;
      if (updates.details) updateData.details = updates.details;

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[Update Article Error]:', error);
        return false;
      }

      // Mettre à jour l'état local
      setArticles(articles.map(a => a.id === id ? { ...a, ...updates } : a));
      console.log('[Update Article Success]:', id);
      return true;
    } catch (error) {
      console.error('[Update Article Exception]:', error);
      return false;
    }
  };

  // Supprimer un article
  const deleteArticle = async (id: string) => {
    try {
      if (!user?.id) return false;

      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[Delete Article Error]:', error);
        return false;
      }

      // Supprimer du state local
      setArticles(articles.filter(a => a.id !== id));
      console.log('[Delete Article Success]:', id);
      return true;
    } catch (error) {
      console.error('[Delete Article Exception]:', error);
      return false;
    }
  };

  const addReservation = (reservation: ReservationRequest) => {
    setReservations([...reservations, reservation]);
  };

  const confirmReservation = (id: string) => {
    setReservations(
      reservations.map(r => r.id === id ? { ...r, status: 'confirmed' as const } : r)
    );
  };

  const cancelReservation = (id: string) => {
    setReservations(
      reservations.map(r => r.id === id ? { ...r, status: 'cancelled' as const } : r)
    );
  };

  const setCalendarAvailability = (date: string, isAvailable: boolean) => {
    const existing = calendar.find(c => c.date === date);
    if (existing) {
      setCalendar(calendar.map(c => c.date === date ? { ...c, isAvailable } : c));
    } else {
      setCalendar([...calendar, { date, isAvailable }]);
    }

    // Enregistrer dans Supabase
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from('admin_availability')
        .upsert([
          {
            admin_id: user.id,
            date,
            is_available: isAvailable,
          },
        ], { onConflict: 'admin_id,date' });
      if (error) {
        console.error('[Supabase Calendar Error]:', error);
      }
    })();
  };

  const updateSubscription = (updates: Partial<AdminSubscription>) => {
    setSubscription(subscription ? { ...subscription, ...updates } : subscription);
  };

  return (
    <AdminContext.Provider
      value={{
        articles,
        reservations,
        calendar,
        subscription,
        loading,
        addArticle,
        updateArticle,
        deleteArticle,
        loadArticles,
        addReservation,
        confirmReservation,
        cancelReservation,
        setReservations,
        setCalendarAvailability,
        updateSubscription,
        users
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};
