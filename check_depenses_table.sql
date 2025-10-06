-- Vérifier si la table depenses existe et sa structure
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table existe
SELECT 'Existence de la table depenses:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'depenses'
) as table_exists;

-- 2. Vérifier la structure de la table
SELECT 'Structure de la table depenses:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT 'Contraintes de la table depenses:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'depenses'
AND tc.table_schema = 'public';

-- 4. Vérifier les permissions RLS
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

-- 5. Tester l'insertion d'une dépense de test
SELECT 'Test d\'insertion:' as info;
-- DÉCOMMENTER POUR TESTER :
/*
INSERT INTO depenses (
    user_id, 
    libelle, 
    montant, 
    date, 
    description,
    recette_id
) VALUES (
    (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
    'Test dépense diagnostic',
    100.00,
    CURRENT_DATE,
    'Test depuis diagnostic',
    (SELECT id FROM recettes ORDER BY created_at DESC LIMIT 1)
) RETURNING *;
*/

