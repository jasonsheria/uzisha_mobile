-- Migration: Ajouter les colonnes manquantes à la table properties

-- Ajouter user_id si elle n'existe pas
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Ajouter visit_price si elle n'existe pas
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS visit_price DECIMAL(12, 2) DEFAULT 0;

-- Ajouter images si elle n'existe pas
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Ajouter videos si elle n'existe pas
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Ajouter features si elle n'existe pas
ALTER TABLE IF EXISTS properties 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Créer index pour user_id
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

-- RLS (Row Level Security) - Permettre aux utilisateurs de voir leurs propres propriétés
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;

-- Créer les nouvelles policies
CREATE POLICY "Users can view their own properties"
  ON properties
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own properties"
  ON properties
  FOR UPDATE
  USING (auth.uid()::uuid = user_id)
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own properties"
  ON properties
  FOR DELETE
  USING (auth.uid()::uuid = user_id);
