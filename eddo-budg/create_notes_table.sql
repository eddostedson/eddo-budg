-- Migration pour créer la table des notes de dépenses futures
-- Permet de garder des dépenses à venir sous forme de notes

-- 1. Créer la table notes (renommée pour être plus générique)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  libelle VARCHAR(255) NOT NULL,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  description TEXT,
  date_prevue DATE,
  priorite VARCHAR(20) NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'convertie', 'annulee')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('recette', 'depense')), -- Nouveau : type de note
  recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL, -- Si convertie en dépense
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_statut ON notes(statut);
CREATE INDEX IF NOT EXISTS idx_notes_priorite ON notes(priorite);
CREATE INDEX IF NOT EXISTS idx_notes_date_prevue ON notes(date_prevue);
CREATE INDEX IF NOT EXISTS idx_notes_recette_id ON notes(recette_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
CREATE POLICY "Enable insert for authenticated users only" ON "public"."notes"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for authenticated users only" ON "public"."notes"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users only" ON "public"."notes"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users only" ON "public"."notes"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Créer la fonction pour updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger pour updated_at
CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_updated_at();

-- 7. Créer une fonction pour convertir une note en dépense
CREATE OR REPLACE FUNCTION convertir_note_en_depense(
  p_note_id UUID,
  p_recette_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_depense_id INTEGER;
  v_note notes_depenses%ROWTYPE;
BEGIN
  -- Récupérer les données de la note
  SELECT * INTO v_note FROM notes_depenses WHERE id = p_note_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note non trouvée ou accès non autorisé';
  END IF;
  
  IF v_note.statut != 'en_attente' THEN
    RAISE EXCEPTION 'Seules les notes en attente peuvent être converties';
  END IF;
  
  -- Créer la dépense
  INSERT INTO depenses (user_id, recette_id, libelle, montant, date, description)
  VALUES (v_note.user_id, p_recette_id, v_note.libelle, v_note.montant, p_date, COALESCE(p_description, v_note.description))
  RETURNING id INTO v_depense_id;
  
  -- Marquer la note comme convertie
  UPDATE notes_depenses 
  SET statut = 'convertie',
      recette_id = p_recette_id,
      updated_at = NOW()
  WHERE id = p_note_id;
  
  RETURN v_depense_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer une fonction pour convertir une note en recette
CREATE OR REPLACE FUNCTION convertir_note_en_recette(
  p_note_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_description TEXT DEFAULT NULL,
  p_source VARCHAR(255) DEFAULT 'Note',
  p_periodicite VARCHAR(20) DEFAULT 'unique'
)
RETURNS UUID AS $$
DECLARE
  v_recette_id UUID;
  v_note notes%ROWTYPE;
BEGIN
  -- Récupérer les données de la note
  SELECT * INTO v_note FROM notes WHERE id = p_note_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note non trouvée ou accès non autorisé';
  END IF;
  
  IF v_note.statut != 'en_attente' THEN
    RAISE EXCEPTION 'Seules les notes en attente peuvent être converties';
  END IF;
  
  IF v_note.type != 'recette' THEN
    RAISE EXCEPTION 'Seules les notes de type recette peuvent être converties en recette';
  END IF;
  
  -- Créer la recette
  INSERT INTO recettes (user_id, libelle, description, montant, solde_disponible, source, periodicite, date_reception, statut)
  VALUES (v_note.user_id, v_note.libelle, COALESCE(p_description, v_note.description), v_note.montant, v_note.montant, p_source, p_periodicite, p_date, 'reçue')
  RETURNING id INTO v_recette_id;
  
  -- Marquer la note comme convertie
  UPDATE notes 
  SET statut = 'convertie',
      updated_at = NOW()
  WHERE id = p_note_id;
  
  RETURN v_recette_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Ajouter les commentaires
COMMENT ON TABLE notes IS 'Table des notes de recettes et dépenses futures';
COMMENT ON COLUMN notes.libelle IS 'Libellé de la note prévue';
COMMENT ON COLUMN notes.montant IS 'Montant prévu';
COMMENT ON COLUMN notes.date_prevue IS 'Date prévue (optionnel)';
COMMENT ON COLUMN notes.priorite IS 'Priorité: basse, normale, haute, urgente';
COMMENT ON COLUMN notes.statut IS 'Statut: en_attente, convertie, annulee';
COMMENT ON COLUMN notes.type IS 'Type: recette ou depense';
COMMENT ON COLUMN notes.recette_id IS 'ID de la recette si convertie en dépense';
COMMENT ON FUNCTION convertir_note_en_depense(UUID, UUID, DATE, TEXT) IS 'Convertit une note en dépense réelle';
COMMENT ON FUNCTION convertir_note_en_recette(UUID, DATE, TEXT, VARCHAR, VARCHAR) IS 'Convertit une note en recette réelle';

-- 10. Message de confirmation
SELECT 'Table notes créée avec succès avec toutes les contraintes et politiques RLS.' AS status;
