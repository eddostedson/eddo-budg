-- Script pour créer/corriger la table des notes
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table notes_depenses si elle n'existe pas
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

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notes_depenses_user_id ON notes_depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_statut ON notes_depenses(statut);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_type ON notes_depenses(type);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_priorite ON notes_depenses(priorite);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_date_prevue ON notes_depenses(date_prevue);

-- 3. Activer RLS
ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques s'elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs propres notes" ON notes_depenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notes_depenses;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON notes_depenses;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON notes_depenses;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON notes_depenses;

-- 5. Créer les nouvelles politiques RLS
CREATE POLICY "Users can manage their own notes"
ON notes_depenses FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Créer le trigger pour updated_at
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

-- 7. Insérer des données de test (optionnel)
INSERT INTO notes_depenses (user_id, libelle, montant, description, date_prevue, priorite, type, statut)
SELECT 
  auth.uid(),
  'Test Note ' || generate_series(1, 3),
  (random() * 1000)::decimal(10,2),
  'Description de test pour la note ' || generate_series(1, 3),
  CURRENT_DATE + (random() * 30)::integer,
  CASE (random() * 3)::integer
    WHEN 0 THEN 'basse'
    WHEN 1 THEN 'normale'
    WHEN 2 THEN 'haute'
    ELSE 'urgente'
  END,
  CASE (random() * 1)::integer
    WHEN 0 THEN 'depense'
    ELSE 'recette'
  END,
  'en_attente'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- 8. Vérifier la création
SELECT 
  'Table créée avec succès' as status,
  COUNT(*) as total_notes
FROM notes_depenses;


















