-- DÉSACTIVER TOUS LES TRIGGERS PROBLÉMATIQUES
-- À exécuter dans Supabase SQL Editor

-- 1. DÉSACTIVER LES TRIGGERS SUR LA TABLE ALLOCATIONS
ALTER TABLE allocations DISABLE TRIGGER trigger_update_recette_solde;

-- 2. DÉSACTIVER LES TRIGGERS SUR LA TABLE DEPENSES_ORIGINAL
ALTER TABLE depenses_original DISABLE TRIGGER trigger_deduire_solde_recette;

-- 3. DÉSACTIVER LES TRIGGERS SUR LA TABLE TRANSFERTS
ALTER TABLE transferts DISABLE TRIGGER trigger_decrementer_solde_recette;
ALTER TABLE transferts DISABLE TRIGGER trigger_incrementer_solde_recette;

-- 4. VÉRIFIER QUE TOUS LES TRIGGERS SONT DÉSACTIVÉS
SELECT 
    'TRIGGERS DÉSACTIVÉS' as info,
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

-- 5. VÉRIFIER L'ÉTAT DES TRIGGERS
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
WHERE action_statement LIKE '%solde%'
   OR action_statement LIKE '%recette%'
   OR action_statement LIKE '%amount%'
   OR action_statement LIKE '%montant%'
ORDER BY event_object_table, trigger_name;
