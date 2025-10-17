-- Vérifier les permissions RLS pour la table depenses
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si RLS est activé sur la table depenses
SELECT 'RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'depenses';

-- 2. Vérifier les politiques RLS existantes
SELECT 'Politiques RLS:' as info;
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
WHERE tablename = 'depenses';

-- 3. Vérifier les permissions de l'utilisateur actuel
SELECT 'Permissions utilisateur:' as info;
SELECT 
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'depenses' 
AND grantee = current_user;

-- 4. Tester l'accès en lecture
SELECT 'Test lecture depenses:' as info;
SELECT COUNT(*) as nombre_depenses FROM depenses;

-- 5. Vérifier l'utilisateur dans le contexte RLS
SELECT 'Contexte utilisateur:' as info;
SELECT 
    current_user as user_name,
    current_user_id() as user_id,
    auth.uid() as auth_uid;

-- 6. Si RLS bloque, créer une politique temporaire (ATTENTION: À NE FAIRE QU'EN DÉVELOPPEMENT)
/*
-- DÉCOMMENTER SEULEMENT SI RLS BLOQUE L'ACCÈS :
CREATE POLICY "Allow all operations for authenticated users" ON depenses
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
*/




















