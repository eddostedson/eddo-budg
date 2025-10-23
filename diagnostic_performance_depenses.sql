-- Diagnostic complet des performances et erreurs d'enregistrement des dépenses
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER L'EXISTENCE DES TABLES
SELECT 
    'TABLES EXISTANTES' as info,
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_name IN ('depenses', 'depenses_test', 'recettes')
ORDER BY table_name;

-- 2. VÉRIFIER LA STRUCTURE DE LA TABLE DEPENSES
SELECT 
    'STRUCTURE DEPENSES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
ORDER BY ordinal_position;

-- 3. VÉRIFIER LES TRIGGERS SUR DEPENSES
SELECT 
    'TRIGGERS DEPENSES' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses';

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

-- 5. VÉRIFIER LES INDEX
SELECT 
    'INDEX DEPENSES' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'depenses';

-- 6. VÉRIFIER LES DONNÉES EXISTANTES
SELECT 
    'DONNÉES DEPENSES' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_montant,
    MIN(created_at) as plus_ancienne,
    MAX(created_at) as plus_recente
FROM depenses;

-- 7. VÉRIFIER LES RECETTES ET LEURS SOLDES
SELECT 
    'RECETTES ET SOLDES' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC
LIMIT 5;

-- 8. TEST D'INSERTION SIMPLE
-- (Décommenter pour tester)
/*
INSERT INTO depenses (
    user_id, 
    libelle, 
    montant, 
    date, 
    description
) VALUES (
    (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
    'Test performance',
    100.00,
    CURRENT_DATE,
    'Test de performance'
) RETURNING *;
*/
