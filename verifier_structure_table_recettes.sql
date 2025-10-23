-- VÉRIFIER LA STRUCTURE DE LA TABLE RECETTES
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES COLONNES DE LA TABLE RECETTES
SELECT 
    'STRUCTURE TABLE RECETTES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES DONNÉES ACTUELLES
SELECT 
    'DONNÉES ACTUELLES' as info,
    id,
    description,
    amount,
    created_at,
    updated_at
FROM recettes 
LIMIT 5;

-- 3. VÉRIFIER S'IL Y A UNE COLONNE SOLDE
SELECT 
    'RECHERCHE COLONNE SOLDE' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'recettes'
  AND (column_name LIKE '%solde%' 
       OR column_name LIKE '%disponible%'
       OR column_name LIKE '%balance%')
ORDER BY column_name;
