-- 🔍 DIAGNOSTIC CORRIGÉ DE L'AFFICHAGE DES RECETTES
-- À exécuter dans Supabase SQL Editor

-- 1. COMPTER TOUTES LES RECETTES
SELECT 
    'TOTAL RECETTES EN BASE' as info,
    COUNT(*) as nb_recettes_total
FROM recettes;

-- 2. VÉRIFIER LES RECETTES PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes
FROM recettes 
GROUP BY user_id
ORDER BY nb_recettes DESC;

-- 3. VÉRIFIER LES RECETTES RÉCENTES
SELECT 
    'RECETTES RÉCENTES' as info,
    description,
    amount,
    created_at,
    updated_at
FROM recettes 
ORDER BY created_at DESC;

-- 4. VÉRIFIER LES RECETTES AVEC DES MONTANTS SUSPECTS
SELECT 
    'RECETTES SUSPECTES' as info,
    description,
    amount,
    created_at
FROM recettes 
WHERE amount < 1000 
   OR amount > 10000000
   OR description LIKE '%TEST%'
   OR description LIKE '%EXEMPLE%'
ORDER BY amount ASC;

-- 5. VÉRIFIER LA STRUCTURE DE LA TABLE RECETTES
SELECT 
    'STRUCTURE TABLE RECETTES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;
