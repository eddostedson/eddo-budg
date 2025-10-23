-- DÉSACTIVER LES TRIGGERS PROBLÉMATIQUES
-- À exécuter dans Supabase SQL Editor

-- 1. DÉSACTIVER TOUS LES TRIGGERS QUI MODIFIENT LES MONTANTS DES RECETTES
ALTER TABLE depenses DISABLE TRIGGER trigger_deduire_solde_recette;
ALTER TABLE depenses DISABLE TRIGGER trigger_incrementer_solde_recette;
ALTER TABLE depenses DISABLE TRIGGER trigger_update_recette_solde;

-- 2. VÉRIFIER QUE LES TRIGGERS SONT DÉSACTIVÉS
SELECT 
    'TRIGGERS DÉSACTIVÉS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
  AND action_statement LIKE '%recette%'
ORDER BY trigger_name;

-- 3. VÉRIFIER L'ÉTAT DES TRIGGERS
SELECT 
    'ÉTAT DES TRIGGERS' as info,
    trigger_name,
    trigger_schema,
    event_object_table,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
  AND action_statement LIKE '%recette%'
ORDER BY trigger_name;
