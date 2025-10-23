-- Vérifier la structure de la table depenses
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER L'EXISTENCE DE LA TABLE
SELECT 
    'EXISTENCE TABLE' as info,
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_name = 'depenses';

-- 2. VÉRIFIER LA STRUCTURE
SELECT 
    'STRUCTURE DEPENSES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
ORDER BY ordinal_position;

-- 3. VÉRIFIER LES POLITIQUES RLS
SELECT 
    'POLITIQUES RLS DEPENSES' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'depenses';

-- 4. VÉRIFIER LES CONTRAINTES
SELECT 
    'CONTRAINTES DEPENSES' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'depenses'
ORDER BY tc.constraint_name;

-- 5. TESTER UNE SUPPRESSION SIMPLE
SELECT 
    'TEST SUPPRESSION' as info,
    COUNT(*) as nb_depenses_avant
FROM depenses;

-- 6. VÉRIFIER LES DÉPENSES LIÉES À PBF Ahokokro
SELECT 
    'DÉPENSES PBF Ahokokro' as info,
    d.id,
    d.libelle,
    d.montant,
    d.recette_id,
    r.description as recette_libelle
FROM depenses d
LEFT JOIN recettes r ON d.recette_id = r.id
WHERE r.description LIKE '%PBF Ahokokro%' OR d.libelle LIKE '%PBF Ahokokro%';
