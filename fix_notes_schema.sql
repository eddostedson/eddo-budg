-- Script de correction du schéma de la table notes_depenses
-- Problème : La colonne 'type' est manquante

-- Vérifier si la table existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes_depenses') THEN
        RAISE NOTICE 'Table notes_depenses n''existe pas, création...';
        
        -- Créer la table avec toutes les colonnes nécessaires
        CREATE TABLE notes_depenses (
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
        CREATE INDEX idx_notes_depenses_user_id ON notes_depenses(user_id);
        CREATE INDEX idx_notes_depenses_statut ON notes_depenses(statut);
        CREATE INDEX idx_notes_depenses_type ON notes_depenses(type);
        CREATE INDEX idx_notes_depenses_priorite ON notes_depenses(priorite);
        CREATE INDEX idx_notes_depenses_date_prevue ON notes_depenses(date_prevue);
        
        -- Activer RLS
        ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;
        
        -- Politique RLS
        CREATE POLICY "Les utilisateurs peuvent gérer leurs propres notes"
        ON notes_depenses FOR ALL
        USING (auth.uid() = user_id);
        
        -- Trigger pour updated_at
        CREATE OR REPLACE FUNCTION update_notes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_notes_updated_at
            BEFORE UPDATE ON notes_depenses
            FOR EACH ROW
            EXECUTE FUNCTION update_notes_updated_at();
            
        RAISE NOTICE 'Table notes_depenses créée avec succès';
    ELSE
        RAISE NOTICE 'Table notes_depenses existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'type' si elle manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_depenses' 
        AND column_name = 'type'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne type...';
        ALTER TABLE notes_depenses 
        ADD COLUMN type VARCHAR(50) DEFAULT 'depense' CHECK (type IN ('recette', 'depense'));
        
        -- Mettre à jour les enregistrements existants
        UPDATE notes_depenses SET type = 'depense' WHERE type IS NULL;
        
        RAISE NOTICE 'Colonne type ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne type existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'statut' si elle manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_depenses' 
        AND column_name = 'statut'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne statut...';
        ALTER TABLE notes_depenses 
        ADD COLUMN statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'convertie', 'annulee'));
        
        -- Mettre à jour les enregistrements existants
        UPDATE notes_depenses SET statut = 'en_attente' WHERE statut IS NULL;
        
        RAISE NOTICE 'Colonne statut ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne statut existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'priorite' si elle manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_depenses' 
        AND column_name = 'priorite'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne priorite...';
        ALTER TABLE notes_depenses 
        ADD COLUMN priorite VARCHAR(50) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente'));
        
        -- Mettre à jour les enregistrements existants
        UPDATE notes_depenses SET priorite = 'normale' WHERE priorite IS NULL;
        
        RAISE NOTICE 'Colonne priorite ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne priorite existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'date_prevue' si elle manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_depenses' 
        AND column_name = 'date_prevue'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne date_prevue...';
        ALTER TABLE notes_depenses 
        ADD COLUMN date_prevue DATE;
        
        RAISE NOTICE 'Colonne date_prevue ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne date_prevue existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'description' si elle manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_depenses' 
        AND column_name = 'description'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne description...';
        ALTER TABLE notes_depenses 
        ADD COLUMN description TEXT;
        
        RAISE NOTICE 'Colonne description ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne description existe déjà';
    END IF;
END $$;

-- Vérifier et ajouter la colonne 'updated_at' si elle manque
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notes_depenses' 
        AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne updated_at...';
        ALTER TABLE notes_depenses 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Colonne updated_at ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne updated_at existe déjà';
    END IF;
END $$;

-- Vérifier et créer les index manquants
DO $$
BEGIN
    -- Index sur user_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notes_depenses' AND indexname = 'idx_notes_depenses_user_id') THEN
        CREATE INDEX idx_notes_depenses_user_id ON notes_depenses(user_id);
        RAISE NOTICE 'Index idx_notes_depenses_user_id créé';
    END IF;
    
    -- Index sur statut
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notes_depenses' AND indexname = 'idx_notes_depenses_statut') THEN
        CREATE INDEX idx_notes_depenses_statut ON notes_depenses(statut);
        RAISE NOTICE 'Index idx_notes_depenses_statut créé';
    END IF;
    
    -- Index sur type
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notes_depenses' AND indexname = 'idx_notes_depenses_type') THEN
        CREATE INDEX idx_notes_depenses_type ON notes_depenses(type);
        RAISE NOTICE 'Index idx_notes_depenses_type créé';
    END IF;
    
    -- Index sur priorite
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notes_depenses' AND indexname = 'idx_notes_depenses_priorite') THEN
        CREATE INDEX idx_notes_depenses_priorite ON notes_depenses(priorite);
        RAISE NOTICE 'Index idx_notes_depenses_priorite créé';
    END IF;
    
    -- Index sur date_prevue
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'notes_depenses' AND indexname = 'idx_notes_depenses_date_prevue') THEN
        CREATE INDEX idx_notes_depenses_date_prevue ON notes_depenses(date_prevue);
        RAISE NOTICE 'Index idx_notes_depenses_date_prevue créé';
    END IF;
END $$;

-- Vérifier et activer RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'notes_depenses' 
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur notes_depenses';
    ELSE
        RAISE NOTICE 'RLS déjà activé sur notes_depenses';
    END IF;
END $$;

-- Vérifier et créer la politique RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notes_depenses' 
        AND policyname = 'Les utilisateurs peuvent gérer leurs propres notes'
    ) THEN
        CREATE POLICY "Les utilisateurs peuvent gérer leurs propres notes"
        ON notes_depenses FOR ALL
        USING (auth.uid() = user_id);
        RAISE NOTICE 'Politique RLS créée';
    ELSE
        RAISE NOTICE 'Politique RLS existe déjà';
    END IF;
END $$;

-- Vérifier et créer le trigger pour updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_notes_updated_at'
    ) THEN
        -- Créer la fonction si elle n'existe pas
        CREATE OR REPLACE FUNCTION update_notes_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Créer le trigger
        CREATE TRIGGER trigger_notes_updated_at
            BEFORE UPDATE ON notes_depenses
            FOR EACH ROW
            EXECUTE FUNCTION update_notes_updated_at();
            
        RAISE NOTICE 'Trigger updated_at créé';
    ELSE
        RAISE NOTICE 'Trigger updated_at existe déjà';
    END IF;
END $$;

-- Afficher la structure finale de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notes_depenses' 
ORDER BY ordinal_position;






















