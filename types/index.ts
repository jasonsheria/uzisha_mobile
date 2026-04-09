// Types pour l'agent immobilier
export interface Agent {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  email?: string;
}

// Types pour les propriétés
export interface Property {
  id: string;
  title: string;
  type:
    | 'house'
    | 'apartment'
    | 'land'
    | 'restaurant'
    | 'event-space'
    | 'gym'
    | 'supermarket'
    | 'clothing-men'
    | 'clothing-women'
    | 'clothing-children'
    | 'shoes-men'
    | 'shoes-women'
    | 'shoes-children'
    | 'belt'
    | 'jacket'
    | 'vest'
    | 'hat'
    | 'phone'
    | 'earphones'
    | 'charger'
    | 'power-bank'
    | 'phone-accessories'
    | 'computer'
    | 'fridge'
    | 'freezer'
    | 'shelf'
    | 'sofa'
    | 'fer'
    | 'fruitier'
    | 'washing-machine'
    | 'other-products';
  listingType: 'sale' | 'rental';
  price: number;
  location: string;
  reviews: number;
  description?: string;
  beds?: number;
  baths?: number;
  area?: number;
  living?: number;
  kitchen?: number;
  parking?: number;
  images: string[]
  agent?: Agent;
  user_Id?: string;
  boutique_id?: string;
  details?: Record<string, any>;
}

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'land'
  | 'restaurant'
  | 'event-space'
  | 'gym'
  | 'supermarket'
  | 'clothing-men'
  | 'clothing-women'
  | 'clothing-children'
  | 'shoes-men'
  | 'shoes-women'
  | 'shoes-children'
  | 'belt'
  | 'jacket'
  | 'vest'
  | 'hat'
  | 'phone'
  | 'earphones'
  | 'charger'
  | 'power-bank'
  | 'phone-accessories'
  | 'computer'
  | 'fridge'
  | 'freezer'
  | 'shelf'
  | 'sofa'
  | 'fer'
  | 'fruitier'
  | 'washing-machine'
  | 'other-products';
export type BOUTIQUE = {
    id: string;
  name: string;
  description: string;
  userId: string;
  adresse: string;
  phone: string;
  image: string;
  logo: string;
  type: string[];
  localization: string | { lat?: string; lng?: string }; // Modifié pour accepter les deux

  //information physique
  province: string;
  Territoire: string;
  Ville: string;
  commune: string
}
// Types pour les réservations
export interface Reservation {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
}

// Types pour les utilisateurs
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isFirstTime?: boolean;
}

// Types pour les filtres
export interface SearchFilter {
  type?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  rating?: number;
}

// Types pour les messages
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isUser: boolean;
}

export interface Conversation {
  id: string;
  agentId: string;
  agent: Agent;
  propertyId?: string;
  propertyTitle?: string;
  messages: Message[];
  lastMessage?: string;
  lastMessageTime?: string;
}
