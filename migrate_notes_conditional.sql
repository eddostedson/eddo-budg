-- Migration conditionnelle pour la table notes
-- Vérifie si la table existe et ajoute les colonnes manquantes

-- 1. Vérifier si la table notes existe
DO $$
BEGIN
    -- Si la table n'existe pas, la créer
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes' AND table_schema = 'public') THEN
        -- Créer la table notes
        CREATE TABLE notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            libelle VARCHAR(255) NOT NULL,
            montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
            description TEXT,
            date_prevue DATE,
            priorite VARCHAR(20) NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
            statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'convertie', 'annulee')),
            type VARCHAR(20) NOT NULL CHECK (type IN ('recette', 'depense')),
            recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Table notes créée avec succès.';
    ELSE
        RAISE NOTICE 'Table notes existe déjà.';
    END IF;
END $$;

-- 2. Ajouter la colonne 'type' si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'type') THEN
        ALTER TABLE notes ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'depense' CHECK (type IN ('recette', 'depense'));
        RAISE NOTICE 'Colonne type ajoutée à la table notes.';
    ELSE
        RAISE NOTICE 'Colonne type existe déjà.';
    END IF;
END $$;

-- 3. Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_statut ON notes(statut);
CREATE INDEX IF NOT EXISTS idx_notes_priorite ON notes(priorite);
CREATE INDEX IF NOT EXISTS idx_notes_date_prevue ON notes(date_prevue);
CREATE INDEX IF NOT EXISTS idx_notes_recette_id ON notes(recette_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);

-- 4. Activer RLS si ce n'est pas déjà fait
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'notes' AND relrowsecurity = true) THEN
        ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé pour la table notes.';
    ELSE
        RAISE NOTICE 'RLS déjà activé pour la table notes.';
    END IF;
END $$;

-- 5. Créer les politiques RLS si elles n'existent pas
DO $$
BEGIN
    -- Politique d'insertion
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Enable insert for authenticated users only') THEN
        CREATE POLICY "Enable insert for authenticated users only" ON "public"."notes"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Politique d''insertion créée.';
    END IF;
    
    -- Politique de sélection
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Enable select for authenticated users only') THEN
        CREATE POLICY "Enable select for authenticated users only" ON "public"."notes"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Politique de sélection créée.';
    END IF;
    
    -- Politique de mise à jour
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Enable update for authenticated users only') THEN
        CREATE POLICY "Enable update for authenticated users only" ON "public"."notes"
        AS PERMISSIVE FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Politique de mise à jour créée.';
    END IF;
    
    -- Politique de suppression
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'Enable delete for authenticated users only') THEN
        CREATE POLICY "Enable delete for authenticated users only" ON "public"."notes"
        AS PERMISSIVE FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Politique de suppression créée.';
    END IF;
END $$;

-- 6. Créer la fonction updated_at si elle n'existe pas
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer le trigger updated_at si il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notes_updated_at') THEN
        CREATE TRIGGER trigger_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW
        EXECUTE FUNCTION update_notes_updated_at();
        RAISE NOTICE 'Trigger updated_at créé.';
    ELSE
        RAISE NOTICE 'Trigger updated_at existe déjà.';
    END IF;
END $$;

-- 8. Créer les fonctions de conversion si elles n'existent pas
CREATE OR REPLACE FUNCTION convertir_note_en_depense(
  p_note_id UUID,
  p_recette_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_depense_id INTEGER;
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
  
  IF v_note.type != 'depense' THEN
    RAISE EXCEPTION 'Seules les notes de type dépense peuvent être converties en dépense';
  END IF;
  
  -- Créer la dépense
  INSERT INTO depenses (user_id, recette_id, libelle, montant, date, description)
  VALUES (v_note.user_id, p_recette_id, v_note.libelle, v_note.montant, p_date, COALESCE(p_description, v_note.description))
  RETURNING id INTO v_depense_id;
  
  -- Marquer la note comme convertie
  UPDATE notes 
  SET statut = 'convertie',
      recette_id = p_recette_id,
      updated_at = NOW()
  WHERE id = p_note_id;
  
  RETURN v_depense_id;
END;
$$ LANGUAGE plpgsql;

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

-- 9. Message de confirmation
SELECT 'Migration conditionnelle des notes terminée avec succès.' AS status;































