-- Debug de la suppression des recettes
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LA RECETTE À SUPPRIMER
SELECT 
    'RECETTE À SUPPRIMER' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.user_id,
    r.created_at
FROM recettes r
WHERE r.description LIKE '%PBF Ahokokro%'
ORDER BY r.created_at DESC;

-- 2. VÉRIFIER LES DÉPENSES LIÉES
SELECT 
    'DÉPENSES LIÉES' as info,
    d.id,
    d.libelle,
    d.montant,
    d.recette_id,
    d.user_id
FROM depenses d
WHERE d.recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.description LIKE '%PBF Ahokokro%'
);

-- 3. VÉRIFIER LES CONTRAINTES
SELECT 
    'CONTRAINTES RECETTES' as info,
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
WHERE tc.table_name = 'recettes'
ORDER BY tc.constraint_name;

-- 4. VÉRIFIER LES POLITIQUES RLS
SELECT 
    'POLITIQUES RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'recettes';

-- 5. TEST DE SUPPRESSION MANUEL
-- (Décommenter pour tester)
/*
DELETE FROM recettes 
WHERE description LIKE '%PBF Ahokokro%'
RETURNING *;
*/
