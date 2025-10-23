-- 🔍 DIAGNOSTIC DE L'AFFICHAGE DES RECETTES
-- À exécuter dans Supabase SQL Editor

-- 1. COMPTER TOUTES LES RECETTES
SELECT 
    'TOTAL RECETTES EN BASE' as info,
    COUNT(*) as nb_recettes_total
FROM recettes;

-- 2. VÉRIFIER LES RECETTES PAR STATUT
SELECT 
    'RECETTES PAR STATUT' as info,
    statut,
    COUNT(*) as nb_recettes
FROM recettes 
GROUP BY statut
ORDER BY nb_recettes DESC;

-- 3. VÉRIFIER LES RECETTES PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes
FROM recettes 
GROUP BY user_id
ORDER BY nb_recettes DESC;

-- 4. VÉRIFIER LES RECETTES RÉCENTES
SELECT 
    'RECETTES RÉCENTES' as info,
    description,
    created_at,
    updated_at,
    statut
FROM recettes 
ORDER BY created_at DESC;

-- 5. VÉRIFIER LES RECETTES AVEC DES MONTANTS SUSPECTS
SELECT 
    'RECETTES SUSPECTES' as info,
    description,
    amount,
    statut,
    created_at
FROM recettes 
WHERE amount < 1000 
   OR amount > 10000000
   OR description LIKE '%TEST%'
   OR description LIKE '%EXEMPLE%'
ORDER BY amount ASC;
