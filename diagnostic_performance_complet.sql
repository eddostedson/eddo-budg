-- Diagnostic complet des performances de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES TRIGGERS SUR LA TABLE DEPENSES
SELECT 
    'TRIGGERS DEPENSES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
ORDER BY trigger_name;

-- 2. VÉRIFIER LES CONTRAINTES ET INDEX
SELECT 
    'CONTRAINTES DEPENSES' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'depenses'
ORDER BY tc.constraint_name;

-- 3. VÉRIFIER LES INDEX
SELECT 
    'INDEX DEPENSES' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'depenses'
ORDER BY indexname;

-- 4. VÉRIFIER LES POLITIQUES RLS
SELECT 
    'POLITIQUES RLS DEPENSES' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'depenses'
ORDER BY policyname;

-- 5. VÉRIFIER LA TAILLE DE LA TABLE
SELECT 
    'TAILLE TABLE DEPENSES' as info,
    pg_size_pretty(pg_total_relation_size('depenses')) as taille_totale,
    pg_size_pretty(pg_relation_size('depenses')) as taille_table,
    pg_size_pretty(pg_total_relation_size('depenses') - pg_relation_size('depenses')) as taille_index
FROM pg_tables 
WHERE tablename = 'depenses';

-- 6. VÉRIFIER LES STATISTIQUES DE PERFORMANCE
SELECT 
    'STATISTIQUES DEPENSES' as info,
    schemaname,
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
WHERE tablename = 'depenses';

-- 7. VÉRIFIER LES REQUÊTES LENTES RÉCENTES
SELECT 
    'REQUÊTES LENTES' as info,
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%depenses%'
ORDER BY mean_time DESC
LIMIT 10;
