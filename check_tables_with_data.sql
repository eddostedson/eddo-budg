-- Vérifier les tables et leurs données
-- À exécuter dans Supabase SQL Editor

-- 1. Lister toutes les tables de l'utilisateur
SELECT 
    'TABLES DISPONIBLES' as test,
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name NOT IN ('backups', 'backup_logs')
ORDER BY table_name;

-- 2. Vérifier les données dans chaque table
SELECT 
    'DONNÉES PAR TABLE' as test,
    'notes_depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM notes_depenses
UNION ALL
SELECT 
    'DONNÉES PAR TABLE' as test,
    'depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM depenses
UNION ALL
SELECT 
    'DONNÉES PAR TABLE' as test,
    'recettes' as table_name,
    COUNT(*) as nombre_enregistrements
FROM recettes
UNION ALL
SELECT 
    'DONNÉES PAR TABLE' as test,
    'categories' as table_name,
    COUNT(*) as nombre_enregistrements
FROM categories
UNION ALL
SELECT 
    'DONNÉES PAR TABLE' as test,
    'goals' as table_name,
    COUNT(*) as nombre_enregistrements
FROM goals
UNION ALL
SELECT 
    'DONNÉES PAR TABLE' as test,
    'transactions' as table_name,
    COUNT(*) as nombre_enregistrements
FROM transactions;

-- 3. Vérifier les tables de sauvegarde
SELECT 
    'TABLES DE SAUVEGARDE' as test,
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_name IN ('backups', 'backup_logs')
ORDER BY table_name;

-- 4. Compter les sauvegardes existantes
SELECT 
    'SAUVEGARDES EXISTANTES' as test,
    COUNT(*) as nombre_sauvegardes,
    MAX(timestamp) as derniere_sauvegarde
FROM backups;

-- 5. Compter les logs existants
SELECT 
    'LOGS EXISTANTS' as test,
    COUNT(*) as nombre_logs,
    MAX(timestamp) as dernier_log
FROM backup_logs;























