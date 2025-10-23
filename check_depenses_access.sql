-- Vérifier l'accès à la table depenses
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier les permissions RLS sur la table depenses
SELECT 
    'PERMISSIONS RLS' as test,
    schemaname,
    tablename,
    rowsecurity as rls_active,
    hasrls as rls_enabled
FROM pg_tables 
WHERE tablename = 'depenses';

-- 2. Vérifier les politiques RLS
SELECT 
    'POLITIQUES RLS' as test,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'depenses';

-- 3. Compter les enregistrements dans depenses
SELECT 
    'COMPTAGE DEPENSES' as test,
    COUNT(*) as nombre_enregistrements,
    'Table accessible' as status
FROM depenses;

-- 4. Vérifier les colonnes de la table depenses
SELECT 
    'COLONNES DEPENSES' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses'
ORDER BY ordinal_position;

-- 5. Tester l'accès avec un utilisateur authentifié
-- (Ceci sera exécuté dans le contexte de l'application)
SELECT 
    'TEST ACCÈS' as test,
    'depenses' as table_name,
    COUNT(*) as count,
    'Accès réussi' as status
FROM depenses
WHERE user_id = auth.uid() OR user_id IS NULL;























