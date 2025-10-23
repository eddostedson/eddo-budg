-- Script de diagnostic du système de sauvegarde
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier si les tables de sauvegarde existent
SELECT 
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_name IN ('backups', 'backup_logs')
ORDER BY table_name;

-- 2. Vérifier la structure des tables
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'backups' 
ORDER BY ordinal_position;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'backup_logs' 
ORDER BY ordinal_position;

-- 3. Compter les enregistrements dans chaque table
SELECT 'backups' as table_name, COUNT(*) as nombre_enregistrements FROM backups
UNION ALL
SELECT 'backup_logs' as table_name, COUNT(*) as nombre_enregistrements FROM backup_logs;

-- 4. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('backups', 'backup_logs')
ORDER BY tablename, policyname;

-- 5. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_actif
FROM pg_tables 
WHERE tablename IN ('backups', 'backup_logs')
ORDER BY tablename;

-- 6. Tester l'insertion d'un log de test
INSERT INTO backup_logs (
    status,
    message,
    timestamp
) VALUES (
    'started',
    'Test de diagnostic du système de sauvegarde',
    NOW()
);

-- 7. Vérifier que le log a été créé
SELECT 
    id,
    status,
    message,
    timestamp
FROM backup_logs 
ORDER BY timestamp DESC 
LIMIT 5;

-- 8. Nettoyer le log de test
DELETE FROM backup_logs 
WHERE message = 'Test de diagnostic du système de sauvegarde';























