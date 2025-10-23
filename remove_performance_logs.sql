-- Script pour identifier les problèmes de performance en base de données
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES TRIGGERS QUI PEUVENT RALENTIR
SELECT 
    'TRIGGERS LENTS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('depenses', 'recettes')
ORDER BY trigger_name;

-- 2. VÉRIFIER LES INDEX MANQUANTS
SELECT 
    'INDEX MANQUANTS' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('depenses', 'recettes')
ORDER BY tablename, indexname;

-- 3. VÉRIFIER LES CONTRAINTES DE CLÉ ÉTRANGÈRE
SELECT 
    'CONTRAINTES FK' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('depenses', 'recettes')
ORDER BY tc.table_name, tc.constraint_name;

-- 4. VÉRIFIER LES STATISTIQUES DE PERFORMANCE
SELECT 
    'STATS PERFORMANCE' as info,
    tablename,
    n_tup_ins as insertions,
    n_tup_upd as mises_a_jour,
    n_tup_del as suppressions,
    n_live_tup as lignes_actives,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename IN ('depenses', 'recettes')
ORDER BY tablename;
