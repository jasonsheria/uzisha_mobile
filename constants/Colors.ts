import { PropertyType } from '@/types';

const Colors = {
  // Couleurs primaires
  primary: '#2563EB',      // Bleu
  secondary: '#F59E0B',    // Ambre/Orange
  accent: '#10B981',       // Vert émeraude
  
  // Couleurs neutres
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F9FAFB',
  gray200: '#F3F4F6',
  gray300: '#E5E7EB',
  gray400: '#D1D5DB',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Couleurs de statut
  success: '#059669',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#0891B2',
  
  // Couleurs des catégories
  houseColor: '#3B82F6',
  apartmentColor: '#8B5CF6',
  landColor: '#EC4899',
  hotelColor: '#F59E0B',
  restaurantColor: '#EF4444',
  eventSpaceColor: '#06B6D4',
  
  // Couleurs de surface avancées
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  
  // Theme dark
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    border: '#334155',
  },
  
  // Theme light
  light: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceVariant: '#F3F4F6',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
};

export const PropertyTypeColors: Record<string, string> = {
  house: Colors.houseColor,
  apartment: Colors.apartmentColor,
  land: Colors.landColor,
  hotel: Colors.hotelColor,
  restaurant: Colors.restaurantColor,
  'event-space': Colors.eventSpaceColor,
};

export default Colors;
