-- Voir les sauvegardes et logs dans Supabase
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier l'existence des tables
SELECT 
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_name IN ('backups', 'backup_logs')
ORDER BY table_name;

-- 2. Voir toutes les sauvegardes
SELECT 
    'SAUVEGARDES' as type,
    id,
    name,
    timestamp,
    status,
    array_length(tables, 1) as nombre_tables,
    pg_size_pretty(pg_column_size(data)) as taille_donnees,
    created_at
FROM backups 
ORDER BY timestamp DESC;

-- 3. Voir tous les logs
SELECT 
    'LOGS' as type,
    id,
    status,
    message,
    duration,
    timestamp,
    backup_id
FROM backup_logs 
ORDER BY timestamp DESC 
LIMIT 20;

-- 4. Statistiques des sauvegardes
SELECT 
    'STATISTIQUES' as type,
    COUNT(*) as total_sauvegardes,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as sauvegardes_reussies,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as sauvegardes_echouees,
    MAX(timestamp) as derniere_sauvegarde,
    MIN(timestamp) as premiere_sauvegarde
FROM backups;

-- 5. Statistiques des logs
SELECT 
    'STATISTIQUES LOGS' as type,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN status = 'started' THEN 1 END) as logs_started,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as logs_success,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as logs_error,
    MAX(timestamp) as dernier_log,
    MIN(timestamp) as premier_log
FROM backup_logs;


























