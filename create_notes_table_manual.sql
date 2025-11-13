-- Script pour créer manuellement la table notes_depenses
-- À exécuter dans l'interface Supabase SQL Editor

-- Créer la table notes_depenses
CREATE TABLE IF NOT EXISTS notes_depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  libelle VARCHAR(255) NOT NULL,
  montant DECIMAL(10,2) NOT NULL CHECK (montant >= 0),
  description TEXT,
  date_prevue DATE,
  priorite VARCHAR(50) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  type VARCHAR(50) DEFAULT 'depense' CHECK (type IN ('recette', 'depense')),
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'convertie', 'annulee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notes_depenses_user_id ON notes_depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_statut ON notes_depenses(statut);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_type ON notes_depenses(type);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_priorite ON notes_depenses(priorite);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_date_prevue ON notes_depenses(date_prevue);

-- Activer RLS
ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les utilisateurs peuvent gérer leurs propres notes
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres notes"
ON notes_depenses FOR ALL
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notes_updated_at ON notes_depenses;
CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes_depenses
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- Commentaires
COMMENT ON TABLE notes_depenses IS 'Table des notes de dépenses et recettes futures';
COMMENT ON COLUMN notes_depenses.libelle IS 'Libellé de la note';
COMMENT ON COLUMN notes_depenses.montant IS 'Montant prévu';
COMMENT ON COLUMN notes_depenses.description IS 'Description détaillée';
COMMENT ON COLUMN notes_depenses.date_prevue IS 'Date prévue pour la transaction';
COMMENT ON COLUMN notes_depenses.priorite IS 'Priorité de la note (basse, normale, haute, urgente)';
COMMENT ON COLUMN notes_depenses.type IS 'Type de note (recette ou depense)';
COMMENT ON COLUMN notes_depenses.statut IS 'Statut de la note (en_attente, convertie, annulee)';

-- Insérer des données de test (optionnel)
-- INSERT INTO notes_depenses (user_id, libelle, montant, description, date_prevue, priorite, type, statut)
-- VALUES 
--   (auth.uid(), 'Test Note 1', 100.00, 'Note de test 1', CURRENT_DATE + INTERVAL '7 days', 'normale', 'depense', 'en_attente'),
--   (auth.uid(), 'Test Note 2', 200.00, 'Note de test 2', CURRENT_DATE + INTERVAL '14 days', 'haute', 'recette', 'en_attente');































