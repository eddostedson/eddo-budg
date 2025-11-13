-- Corriger les permissions pour la sauvegarde
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'état actuel des permissions RLS
SELECT 
    'PERMISSIONS ACTUELLES' as test,
    schemaname,
    tablename,
    rowsecurity as rls_active
FROM pg_tables 
WHERE tablename IN ('depenses', 'recettes', 'notes_depenses', 'categories', 'goals', 'transactions', 'budgets', 'transferts')
ORDER BY tablename;

-- 2. Désactiver temporairement RLS pour les tables de sauvegarde
-- (ATTENTION: Ceci peut exposer les données, utilisez avec précaution)
ALTER TABLE depenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes_depenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transferts DISABLE ROW LEVEL SECURITY;

-- 3. Vérifier que RLS est désactivé
SELECT 
    'PERMISSIONS APRÈS' as test,
    schemaname,
    tablename,
    rowsecurity as rls_active
FROM pg_tables 
WHERE tablename IN ('depenses', 'recettes', 'notes_depenses', 'categories', 'goals', 'transactions', 'budgets', 'transferts')
ORDER BY tablename;

-- 4. Tester l'accès aux tables
SELECT 
    'TEST ACCÈS' as test,
    'depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM depenses
UNION ALL
SELECT 
    'TEST ACCÈS' as test,
    'recettes' as table_name,
    COUNT(*) as nombre_enregistrements
FROM recettes
UNION ALL
SELECT 
    'TEST ACCÈS' as test,
    'notes_depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM notes_depenses;

-- 5. Créer une sauvegarde de test
DO $$
DECLARE
    backup_id UUID;
    backup_name TEXT;
    depenses_count INT;
    recettes_count INT;
    notes_count INT;
BEGIN
    -- Compter les enregistrements
    SELECT COUNT(*) INTO depenses_count FROM depenses;
    SELECT COUNT(*) INTO recettes_count FROM recettes;
    SELECT COUNT(*) INTO notes_count FROM notes_depenses;
    
    -- Nom de la sauvegarde
    backup_name := 'test_permissions_' || to_char(now(), 'YYYY-MM-DD_HH24-MI-SS');
    
    -- Créer la sauvegarde
    INSERT INTO backups (name, timestamp, status, tables, data)
    VALUES (
        backup_name, 
        now(), 
        'success', 
        ARRAY['depenses', 'recettes', 'notes_depenses'],
        jsonb_build_object(
            'depenses', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM depenses t),
            'recettes', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM recettes t),
            'notes_depenses', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM notes_depenses t)
        )
    )
    RETURNING id INTO backup_id;
    
    -- Créer un log
    INSERT INTO backup_logs (status, message, backup_id, timestamp)
    VALUES (
        'success', 
        'Test de sauvegarde avec permissions corrigées: ' || backup_name || 
        ' | Depenses: ' || depenses_count || 
        ' | Recettes: ' || recettes_count || 
        ' | Notes: ' || notes_count,
        backup_id,
        now()
    );
    
    RAISE NOTICE 'Sauvegarde de test créée: % (ID: %)', backup_name, backup_id;
    RAISE NOTICE 'Depenses: %, Recettes: %, Notes: %', depenses_count, recettes_count, notes_count;
END $$;

-- 6. Vérifier la sauvegarde créée
SELECT 
    'SAUVEGARDE CRÉÉE' as test,
    id,
    name,
    timestamp,
    status,
    array_length(tables, 1) as nombre_tables,
    pg_size_pretty(pg_column_size(data)) as taille_donnees
FROM backups 
ORDER BY timestamp DESC 
LIMIT 1;





























