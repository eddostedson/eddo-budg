-- Script complet pour corriger les notes
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'existence de la table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes_depenses') THEN
        RAISE NOTICE 'Table notes_depenses n''existe pas, création en cours...';
        
        -- Créer la table
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
        
        RAISE NOTICE 'Table notes_depenses créée avec succès';
    ELSE
        RAISE NOTICE 'Table notes_depenses existe déjà';
    END IF;
END $$;

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_notes_depenses_user_id ON notes_depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_statut ON notes_depenses(statut);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_type ON notes_depenses(type);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_priorite ON notes_depenses(priorite);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_date_prevue ON notes_depenses(date_prevue);

-- 3. Activer RLS
ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer toutes les anciennes politiques
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'notes_depenses'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON notes_depenses';
        RAISE NOTICE 'Politique supprimée: %', policy_name;
    END LOOP;
END $$;

-- 5. Créer une nouvelle politique RLS simple et efficace
CREATE POLICY "notes_policy" ON notes_depenses
FOR ALL TO authenticated
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

-- 7. Insérer des données de test pour l'utilisateur actuel
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur actuel
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NOT NULL THEN
        -- Insérer des notes de test
        INSERT INTO notes_depenses (user_id, libelle, montant, description, date_prevue, priorite, type, statut)
        VALUES 
            (current_user_id, 'Loyer Janvier', 150000, 'Paiement du loyer pour le mois de janvier', CURRENT_DATE + 5, 'haute', 'depense', 'en_attente'),
            (current_user_id, 'Salaire Février', 250000, 'Salaire du mois de février', CURRENT_DATE + 10, 'normale', 'recette', 'en_attente'),
            (current_user_id, 'Courses Supermarché', 45000, 'Courses hebdomadaires', CURRENT_DATE + 3, 'normale', 'depense', 'en_attente'),
            (current_user_id, 'Prime Performance', 75000, 'Prime de performance Q1', CURRENT_DATE + 15, 'normale', 'recette', 'en_attente'),
            (current_user_id, 'Facture Électricité', 25000, 'Facture d''électricité', CURRENT_DATE + 7, 'haute', 'depense', 'en_attente')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Données de test insérées pour l''utilisateur %', current_user_id;
    ELSE
        RAISE NOTICE 'Aucun utilisateur authentifié, données de test non insérées';
    END IF;
END $$;

-- 8. Vérifier la configuration finale
SELECT 
    'Configuration terminée' as status,
    COUNT(*) as total_notes,
    COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as notes_en_attente,
    COUNT(CASE WHEN type = 'depense' THEN 1 END) as notes_depenses,
    COUNT(CASE WHEN type = 'recette' THEN 1 END) as notes_recettes
FROM notes_depenses;

-- 9. Afficher les politiques RLS actives
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'notes_depenses';

-- 10. Vérifier que RLS est activé
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notes_depenses';





















