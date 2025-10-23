-- VÉRIFIER LES TRIGGERS EXISTANTS
-- À exécuter dans Supabase SQL Editor

-- 1. LISTER TOUS LES TRIGGERS SUR LA TABLE DEPENSES
SELECT 
    'TRIGGERS DEPENSES EXISTANTS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
ORDER BY trigger_name;

-- 2. LISTER TOUS LES TRIGGERS SUR LA TABLE RECETTES
SELECT 
    'TRIGGERS RECETTES EXISTANTS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recettes'
ORDER BY trigger_name;

-- 3. RECHERCHER TOUS LES TRIGGERS QUI CONTIENNENT "SOLDE" OU "RECETTE"
SELECT 
    'TRIGGERS AVEC SOLDE/RECETTE' as info,
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%solde%'
   OR action_statement LIKE '%recette%'
   OR action_statement LIKE '%amount%'
   OR action_statement LIKE '%montant%'
ORDER BY event_object_table, trigger_name;
