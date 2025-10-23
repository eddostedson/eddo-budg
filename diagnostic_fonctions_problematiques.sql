-- DIAGNOSTIC DES FONCTIONS PROBLÉMATIQUES
-- À exécuter dans Supabase SQL Editor

-- 1. VOIR LE CODE COMPLET DES FONCTIONS SUSPECTES
SELECT 
    'CODE COMPLET FONCTIONS' as type,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'convertir_note_en_recette',
    'decrementer_solde_recette', 
    'deduire_solde_recette',
    'incrementer_solde_recette',
    'update_recette_solde'
  )
ORDER BY routine_name;

-- 2. VÉRIFIER LES TRIGGERS QUI APPELLENT CES FONCTIONS
SELECT 
    'TRIGGERS QUI APPELLENT LES FONCTIONS' as type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recettes'
  AND action_statement LIKE '%decrementer_solde_recette%'
   OR action_statement LIKE '%incrementer_solde_recette%'
   OR action_statement LIKE '%deduire_solde_recette%'
   OR action_statement LIKE '%update_recette_solde%'
   OR action_statement LIKE '%convertir_note_en_recette%'
ORDER BY trigger_name;

-- 3. VÉRIFIER LES TRIGGERS SUR LA TABLE DEPENSES QUI PEUVENT AFFECTER LES RECETTES
SELECT 
    'TRIGGERS DEPENSES QUI AFFECTENT RECETTES' as type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
  AND action_statement LIKE '%recette%'
ORDER BY trigger_name;
