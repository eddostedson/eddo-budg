-- Vérification simple de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table depenses existe
SELECT 'Table depenses existe:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'depenses'
) as table_exists;

-- 2. Compter les dépenses existantes
SELECT 'Nombre de dépenses:' as info;
SELECT COUNT(*) as nombre_depenses FROM depenses;

-- 3. Vérifier les recettes
SELECT 'Nombre de recettes:' as info;
SELECT COUNT(*) as nombre_recettes FROM recettes;

-- 4. Vérifier l'utilisateur
SELECT 'Utilisateur actuel:' as info;
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;




























