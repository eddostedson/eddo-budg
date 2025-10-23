-- DIAGNOSTIC DES MONTANTS SUSPECTS
-- À exécuter dans Supabase SQL Editor

-- 1. RECETTES AVEC MONTANTS SUSPECTS (14200, 1420, 142)
SELECT 
    'RECETTES PROBLÉMATIQUES' as type,
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

-- 2. TOUS LES TRIGGERS SUR LA TABLE RECETTES
SELECT 
    'TRIGGERS RECETTES' as type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    LEFT(action_statement, 150) as action_debut
FROM information_schema.triggers 
WHERE event_object_table = 'recettes'
ORDER BY trigger_name;

-- 3. FONCTIONS QUI PEUVENT MODIFIER LES MONTANTS
SELECT 
    'FONCTIONS SUSPECTES' as type,
    routine_name,
    routine_type,
    LEFT(routine_definition, 200) as definition_debut
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%recette%' 
       OR routine_name LIKE '%amount%' 
       OR routine_name LIKE '%montant%'
       OR routine_name LIKE '%solde%'
       OR routine_name LIKE '%balance%')
ORDER BY routine_name;
