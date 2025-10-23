-- IDENTIFIER LES RECETTES PROBLÉMATIQUES
-- À exécuter dans Supabase SQL Editor

-- 1. RECETTES AVEC MONTANTS SUSPECTS
SELECT 
    'RECETTES PROBLÉMATIQUES' as info,
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
        WHEN amount < 10000 AND description LIKE '%REVERSEMENT%' THEN '🚨 MONTANT TROP BAS'
        WHEN amount < 10000 AND description LIKE '%EXPERTISE%' THEN '🚨 MONTANT TROP BAS'
        ELSE '✅ Normal'
    END as statut
FROM recettes 
WHERE description LIKE '%BSIC REVERSEMENT%' 
   OR description LIKE '%EXPERTISE%'
   OR amount IN (14200, 1420, 142)
   OR (amount < 1000 AND (description LIKE '%BSIC%' OR description LIKE '%EXPERTISE%'))
   OR (amount < 10000 AND (description LIKE '%REVERSEMENT%' OR description LIKE '%EXPERTISE%'))
ORDER BY amount ASC;

-- 2. TOUTES LES RECETTES POUR VÉRIFICATION
SELECT 
    'TOUTES LES RECETTES' as info,
    id,
    description,
    amount as montant_actuel,
    created_at,
    updated_at
FROM recettes 
ORDER BY amount ASC;
