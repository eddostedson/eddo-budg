-- 🔧 ADAPTER LE CODE À LA STRUCTURE RÉELLE
-- Script pour identifier les colonnes disponibles et adapter le code

-- 1. IDENTIFIER TOUTES LES COLONNES DISPONIBLES
SELECT 
    'COLONNES DISPONIBLES' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. TESTER UNE INSERTION AVEC LES COLONNES RÉELLES
-- (Remplacez les noms de colonnes par ceux qui existent réellement)
BEGIN;
-- Exemple avec les colonnes probables :
INSERT INTO recettes (
    user_id, 
    description,  -- au lieu de libelle
    amount,       -- au lieu de montant
    solde_disponible,
    statut
) VALUES (
    auth.uid(),
    'TEST ADAPTATION',
    1000.00,
    1000.00,
    'reçue'
);
ROLLBACK;

-- 3. VÉRIFIER LES CONTRAINTES
SELECT 
    'CONTRAINTES' as info,
    conname,
    contype,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'recettes'::regclass;


