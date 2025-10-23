-- CORRIGER LES MONTANTS DES RECETTES
-- À exécuter dans Supabase SQL Editor

-- 1. IDENTIFIER LES RECETTES AVEC DES MONTANTS SUSPECTS
SELECT 
    'RECETTES À CORRIGER' as info,
    id,
    description,
    amount as montant_actuel,
    created_at,
    updated_at,
    CASE 
        WHEN amount = 14200 THEN '🚨 MONTANT SUSPECT: 14200'
        WHEN amount = 1420 THEN '🚨 MONTANT SUSPECT: 1420' 
        WHEN amount = 142 THEN '🚨 MONTANT SUSPECT: 142'
        WHEN amount < 1000 AND description LIKE '%BSIC%' THEN '🚨 MONTANT TROP BAS'
        WHEN amount < 1000 AND description LIKE '%EXPERTISE%' THEN '🚨 MONTANT TROP BAS'
        ELSE '✅ Normal'
    END as statut
FROM recettes 
WHERE description LIKE '%BSIC REVERSEMENT%' 
   OR description LIKE '%EXPERTISE%'
   OR amount IN (14200, 1420, 142)
   OR (amount < 1000 AND (description LIKE '%BSIC%' OR description LIKE '%EXPERTISE%'))
ORDER BY updated_at DESC;

-- 2. VÉRIFIER LES MONTANTS AVANT CORRECTION
SELECT 
    'MONTANTS AVANT CORRECTION' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_montants,
    AVG(amount) as moyenne_montants,
    MIN(amount) as montant_min,
    MAX(amount) as montant_max
FROM recettes;
