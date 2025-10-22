-- Script final pour créer la table des notes
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table notes_depenses
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

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_notes_depenses_user_id ON notes_depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_statut ON notes_depenses(statut);
CREATE INDEX IF NOT EXISTS idx_notes_depenses_type ON notes_depenses(type);

-- 3. Activer RLS
ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "notes_policy" ON notes_depenses;
DROP POLICY IF EXISTS "Users can manage their own notes" ON notes_depenses;
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs propres notes" ON notes_depenses;

-- 5. Créer une nouvelle politique RLS
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

-- 7. Insérer des données de test
INSERT INTO notes_depenses (user_id, libelle, montant, description, date_prevue, priorite, type, statut)
SELECT 
    auth.uid(),
    'Loyer Janvier',
    150000,
    'Paiement du loyer pour le mois de janvier',
    CURRENT_DATE + 5,
    'haute',
    'depense',
    'en_attente'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO notes_depenses (user_id, libelle, montant, description, date_prevue, priorite, type, statut)
SELECT 
    auth.uid(),
    'Salaire Février',
    250000,
    'Salaire du mois de février',
    CURRENT_DATE + 10,
    'normale',
    'recette',
    'en_attente'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- 8. Vérifier la création
SELECT 
    'Table notes_depenses créée avec succès' as status,
    COUNT(*) as total_notes
FROM notes_depenses;














