-- 🔧 ADAPTER LE DIRECT SERVICE À LA STRUCTURE RÉELLE
-- Script pour identifier la structure et adapter le code

-- 1. IDENTIFIER LA STRUCTURE RÉELLE
SELECT 
    'STRUCTURE RÉELLE RECETTES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES DONNÉES EXISTANTES
SELECT 
    'DONNÉES EXISTANTES' as info,
    *
FROM recettes 
LIMIT 2;

-- 3. TESTER DIFFÉRENTES STRUCTURES POSSIBLES
-- Structure possible 1: description, amount
BEGIN;
INSERT INTO recettes (user_id, description, amount) 
VALUES (auth.uid(), 'TEST STRUCTURE 1', 1000.00);
ROLLBACK;

-- Structure possible 2: libelle, montant (si les colonnes existent)
-- BEGIN;
-- INSERT INTO recettes (user_id, libelle, montant) 
-- VALUES (auth.uid(), 'TEST STRUCTURE 2', 1000.00);
-- ROLLBACK;

-- 4. IDENTIFIER LES COLONNES OBLIGATOIRES
SELECT 
    'COLONNES OBLIGATOIRES' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes' 
AND is_nullable = 'NO'
ORDER BY ordinal_position;


