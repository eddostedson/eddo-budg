-- DIAGNOSTIC AVANT SAUVEGARDE - NE PAS SAUVEGARDER ENCORE !
-- À exécuter dans Supabase SQL Editor

-- 1. IDENTIFIER LES RECETTES PROBLÉMATIQUES
SELECT 
    id,
    description,
    amount as montant_actuel,
    created_at,
    updated_at,
    CASE 
        WHEN amount = 14200 THEN '🚨 PROBLÈME: Montant 14200'
        WHEN amount = 1420 THEN '🚨 PROBLÈME: Montant 1420' 
        WHEN amount = 142 THEN '🚨 PROBLÈME: Montant 142'
        WHEN amount < 1000 AND description LIKE '%BSIC%' THEN '🚨 PROBLÈME: Montant trop bas'
        WHEN amount < 1000 AND description LIKE '%EXPERTISE%' THEN '🚨 PROBLÈME: Montant trop bas'
        ELSE '✅ Normal'
    END as statut
FROM recettes 
WHERE description LIKE '%BSIC REVERSEMENT%' 
   OR description LIKE '%EXPERTISE%'
   OR amount IN (14200, 1420, 142)
   OR (amount < 1000 AND (description LIKE '%BSIC%' OR description LIKE '%EXPERTISE%'))
ORDER BY updated_at DESC;

-- 2. VÉRIFIER LES TRIGGERS QUI PEUVENT MODIFIER LES MONTANTS
SELECT 
    'TRIGGERS ACTIFS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    LEFT(action_statement, 100) as action_debut
FROM information_schema.triggers 
WHERE event_object_table = 'recettes'
ORDER BY trigger_name;

-- 3. VÉRIFIER LES FONCTIONS QUI PEUVENT MODIFIER LES MONTANTS
SELECT 
    'FONCTIONS SUSPECTES' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%recette%' OR routine_name LIKE '%amount%' OR routine_name LIKE '%montant%')
ORDER BY routine_name;

-- 4. VÉRIFIER LES POLITIQUES RLS QUI PEUVENT AFFECTER LES MONTANTS
SELECT 
    'POLITIQUES RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'recettes'
ORDER BY policyname;
