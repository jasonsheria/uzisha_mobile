// Service API pour les réservations
import { Reservation } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface CreateReservationData {
  propertyId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export const reservationService = {
  // Récupérer toutes les réservations de l'utilisateur
  async getUserReservations(userId: string): Promise<Reservation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return response.json();
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  },

  // Récupérer une réservation par ID
  async getReservation(id: string): Promise<Reservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}`);
      if (!response.ok) throw new Error('Réservation non trouvée');
      return response.json();
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw error;
    }
  },

  // Créer une nouvelle réservation
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  // Annuler une réservation
  async cancelReservation(id: string): Promise<Reservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}/cancel`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erreur lors de l\'annulation');
      return response.json();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  },

  // Confirmer une réservation
  async confirmReservation(id: string): Promise<Reservation> {
    try {
      const response = await fetch(`${API_BASE_URL}/reservations/${id}/confirm`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Erreur lors de la confirmation');
      return response.json();
    } catch (error) {
      console.error('Error confirming reservation:', error);
      throw error;
    }
  },

  // Vérifier la disponibilité
  async checkAvailability(
    propertyId: string,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/properties/${propertyId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
      );
      if (!response.ok) throw new Error('Erreur lors de la vérification');
      const data = await response.json();
      return data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },
};
