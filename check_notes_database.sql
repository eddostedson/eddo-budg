-- Script de diagnostic pour vérifier la configuration des notes
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les tables existantes contenant "note"
SELECT 
    table_name, 
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%note%' OR table_name LIKE '%depense%')
ORDER BY table_name;

-- 2. Vérifier la structure de notes_depenses si elle existe
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'notes_depenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'notes_depenses'
ORDER BY policyname;

-- 4. Vérifier si RLS est activé
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notes_depenses';

-- 5. Compter les enregistrements
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM notes_depenses;

-- 6. Vérifier les permissions sur la table
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'notes_depenses' 
AND table_schema = 'public';

-- 7. Vérifier les contraintes
SELECT 
    constraint_name, 
    constraint_type, 
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'notes_depenses' 
AND tc.table_schema = 'public';
