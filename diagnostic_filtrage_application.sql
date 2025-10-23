-- 🔍 DIAGNOSTIC DU FILTRAGE DE L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES RECETTES PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes
FROM recettes 
GROUP BY user_id
ORDER BY nb_recettes DESC;

-- 2. VÉRIFIER LES RECETTES RÉCENTES (DERNIÈRES 8)
SELECT 
    'DERNIÈRES 8 RECETTES' as info,
    description,
    amount,
    created_at,
    updated_at
FROM recettes 
ORDER BY created_at DESC
LIMIT 8;

-- 3. VÉRIFIER LES RECETTES LES PLUS ANCIENNES
SELECT 
    'RECETTES LES PLUS ANCIENNES' as info,
    description,
    amount,
    created_at,
    updated_at
FROM recettes 
ORDER BY created_at ASC
LIMIT 3;

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

-- 5. VÉRIFIER LES RECETTES PAR MONTANT (TRIÉES)
SELECT 
    'RECETTES PAR MONTANT' as info,
    description,
    amount,
    created_at
FROM recettes 
ORDER BY amount DESC;
