-- Script de diagnostic simple pour les notes
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table notes_depenses existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes_depenses' AND table_schema = 'public') 
        THEN 'Table notes_depenses existe' 
        ELSE 'Table notes_depenses n''existe PAS' 
    END as table_status;

-- 2. Si la table existe, vérifier sa structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notes_depenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'notes_depenses'
ORDER BY policyname;

-- 4. Vérifier si RLS est activé
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notes_depenses';

-- 5. Compter les enregistrements (si la table existe)
SELECT 
    COUNT(*) as total_records
FROM notes_depenses;

-- 6. Afficher quelques enregistrements récents
SELECT 
    id, 
    libelle, 
    montant, 
    statut, 
    type, 
    created_at
FROM notes_depenses 
ORDER BY created_at DESC 
LIMIT 5;


















