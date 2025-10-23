-- DIAGNOSTIC DES MONTANTS DE RECETTES QUI CHANGENT
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES RECETTES AVEC DES MONTANTS SUSPECTS
SELECT 
    id,
    description,
    amount as montant_actuel,
    created_at,
    updated_at,
    CASE 
        WHEN amount = 14200 THEN '⚠️ MONTANT SUSPECT: 14200'
        WHEN amount = 1420 THEN '⚠️ MONTANT SUSPECT: 1420'
        WHEN amount = 142 THEN '⚠️ MONTANT SUSPECT: 142'
        ELSE '✅ Normal'
    END as statut
FROM recettes 
WHERE description LIKE '%BSIC REVERSEMENT%' 
   OR description LIKE '%EXPERTISE%'
   OR amount IN (14200, 1420, 142)
ORDER BY updated_at DESC;

-- 2. VÉRIFIER L'HISTORIQUE DES MODIFICATIONS
SELECT 
    'HISTORIQUE DES CHANGEMENTS' as info,
    COUNT(*) as nb_modifications,
    MIN(updated_at) as premiere_modification,
    MAX(updated_at) as derniere_modification
FROM recettes 
WHERE updated_at != created_at;

-- 3. VÉRIFIER LES TRIGGERS QUI PEUVENT MODIFIER LES MONTANTS
SELECT 
    'TRIGGERS RECETTES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recettes'
ORDER BY trigger_name;

-- 4. VÉRIFIER LES FONCTIONS QUI PEUVENT MODIFIER LES MONTANTS
SELECT 
    'FONCTIONS RECETTES' as info,
    routine_name,
    routine_type,
    LEFT(routine_definition, 200) as definition_debut
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%recette%' OR routine_name LIKE '%amount%' OR routine_name LIKE '%montant%')
ORDER BY routine_name;
