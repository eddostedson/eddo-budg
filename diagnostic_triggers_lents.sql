-- Diagnostic des triggers qui peuvent ralentir l'enregistrement
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER TOUS LES TRIGGERS SUR DEPENSES
SELECT 
    'TRIGGERS DEPENSES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
ORDER BY trigger_name;

-- 2. VÉRIFIER LES TRIGGERS SUR RECETTES (qui peuvent être déclenchés)
SELECT 
    'TRIGGERS RECETTES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recettes'
ORDER BY trigger_name;

-- 3. VÉRIFIER LES FONCTIONS DÉCLENCHÉES
SELECT 
    'FONCTIONS TRIGGERS' as info,
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%depense%' 
   OR routine_name LIKE '%recette%'
   OR routine_name LIKE '%solde%'
   OR routine_name LIKE '%balance%'
ORDER BY routine_name;

-- 4. VÉRIFIER LES CONTRAINTES DE CLÉ ÉTRANGÈRE COMPLEXES
SELECT 
    'CONTRAINTES COMPLEXES' as info,
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'depenses' OR ccu.table_name = 'depenses')
ORDER BY tc.table_name, tc.constraint_name;

-- 5. VÉRIFIER LES INDEX MANQUANTS
SELECT 
    'INDEX MANQUANTS' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('depenses', 'recettes')
ORDER BY tablename, indexname;

-- 6. VÉRIFIER LES STATISTIQUES DE PERFORMANCE
SELECT 
    'STATS PERFORMANCE' as info,
    tablename,
    n_tup_ins as insertions,
    n_tup_upd as mises_a_jour,
    n_tup_del as suppressions,
    n_live_tup as lignes_actives,
    n_dead_tup as lignes_mortes,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('depenses', 'recettes')
ORDER BY tablename;
