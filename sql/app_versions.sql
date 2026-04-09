-- Table pour imposer les versions minimales de l'app mobile
CREATE TABLE IF NOT EXISTS app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(10) NOT NULL, -- 'android' ou 'ios'
  min_version VARCHAR(20) NOT NULL, -- version minimale requise (ex: '1.2.0')
  force_update BOOLEAN NOT NULL DEFAULT true, -- impose la mise à jour
  message TEXT, -- message personnalisé à afficher à l'utilisateur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_app_versions_platform ON app_versions(platform);
