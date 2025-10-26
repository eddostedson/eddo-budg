-- 🔄 MIGRATION - AJOUTER LES COLONNES MANQUANTES
-- Script pour ajouter les colonnes nécessaires à la table recettes

-- 1. VÉRIFIER LA STRUCTURE ACTUELLE
SELECT 
    'STRUCTURE ACTUELLE' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. AJOUTER LES COLONNES MANQUANTES (si elles n'existent pas)
DO $$
BEGIN
    -- Ajouter la colonne libelle si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'libelle'
    ) THEN
        ALTER TABLE recettes ADD COLUMN libelle VARCHAR(255);
        RAISE NOTICE '✅ Colonne libelle ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne libelle existe déjà';
    END IF;

    -- Ajouter la colonne montant si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'montant'
    ) THEN
        ALTER TABLE recettes ADD COLUMN montant DECIMAL(10,2);
        RAISE NOTICE '✅ Colonne montant ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne montant existe déjà';
    END IF;

    -- Ajouter la colonne solde_disponible si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'solde_disponible'
    ) THEN
        ALTER TABLE recettes ADD COLUMN solde_disponible DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Colonne solde_disponible ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne solde_disponible existe déjà';
    END IF;

    -- Ajouter la colonne date_reception si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'date_reception'
    ) THEN
        ALTER TABLE recettes ADD COLUMN date_reception DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ Colonne date_reception ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne date_reception existe déjà';
    END IF;

    -- Ajouter la colonne statut si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recettes' AND column_name = 'statut'
    ) THEN
        ALTER TABLE recettes ADD COLUMN statut VARCHAR(50) DEFAULT 'reçue';
        RAISE NOTICE '✅ Colonne statut ajoutée';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne statut existe déjà';
    END IF;

END $$;

-- 3. VÉRIFIER LA NOUVELLE STRUCTURE
SELECT 
    'NOUVELLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 4. TESTER UNE INSERTION AVEC LA NOUVELLE STRUCTURE
BEGIN;
INSERT INTO recettes (
    user_id,
    libelle,
    montant,
    solde_disponible,
    date_reception,
    statut
) VALUES (
    auth.uid(),
    'TEST MIGRATION',
    1000.00,
    1000.00,
    CURRENT_DATE,
    'reçue'
);
ROLLBACK;

-- 5. AJOUTER DES CONTRAINTES SI NÉCESSAIRE
ALTER TABLE recettes 
ADD CONSTRAINT IF NOT EXISTS recettes_montant_check 
CHECK (montant >= 0);

ALTER TABLE recettes 
ADD CONSTRAINT IF NOT EXISTS recettes_solde_disponible_check 
CHECK (solde_disponible >= 0);

ALTER TABLE recettes 
ADD CONSTRAINT IF NOT EXISTS recettes_statut_check 
CHECK (statut IN ('attendue', 'reçue', 'retardée', 'annulée'));

-- 6. AJOUTER DES INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_recettes_libelle ON recettes(libelle);
CREATE INDEX IF NOT EXISTS idx_recettes_montant ON recettes(montant);
CREATE INDEX IF NOT EXISTS idx_recettes_date_reception ON recettes(date_reception);
CREATE INDEX IF NOT EXISTS idx_recettes_statut ON recettes(statut);


