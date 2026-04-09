// Service API pour les propriétés
import { Property, PropertyType, SearchFilter } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const propertyService = {
  // Récupérer toutes les propriétés
  async getProperties(filters?: SearchFilter): Promise<Property[]> {
    try {
      const query = new URLSearchParams();
      if (filters?.type) query.append('type', filters.type);
      if (filters?.priceMin) query.append('priceMin', filters.priceMin.toString());
      if (filters?.priceMax) query.append('priceMax', filters.priceMax.toString());
      if (filters?.location) query.append('location', filters.location);
      if (filters?.rating) query.append('rating', filters.rating.toString());

      const response = await fetch(`${API_BASE_URL}/properties?${query}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des propriétés');
      return response.json();
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Récupérer une propriété par ID
  async getProperty(id: string): Promise<Property> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`);
      if (!response.ok) throw new Error('Propriété non trouvée');
      return response.json();
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  // Créer une nouvelle propriété
  async createProperty(property: Omit<Property, 'id'>): Promise<Property> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property),
      });
      if (!response.ok) throw new Error('Erreur lors de la création');
      return response.json();
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  },

  // Mettre à jour une propriété
  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      return response.json();
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  },

  // Supprimer une propriété
  async deleteProperty(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  },

  // Rechercher des propriétés par texte
  async searchProperties(query: string): Promise<Property[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/search?query=${query}`);
      if (!response.ok) throw new Error('Erreur lors de la recherche');
      return response.json();
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  },

  // Obtenir les propriétés en vedette
  async getFeaturedProperties(): Promise<Property[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/featured`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return response.json();
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      throw error;
    }
  },

  // Obtenir les propriétés populaires
  async getPopularProperties(): Promise<Property[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/popular`);
      if (!response.ok) throw new Error('Erreur lors de la récupération');
      return response.json();
    } catch (error) {
      console.error('Error fetching popular properties:', error);
      throw error;
    }
  },
};
