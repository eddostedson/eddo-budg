-- Sauvegarde automatique avec gestion RLS
-- À exécuter dans Supabase SQL Editor

DO $$
DECLARE
    backup_id UUID;
    backup_name TEXT;
    depenses_count INT;
    recettes_count INT;
    notes_count INT;
    categories_count INT;
    goals_count INT;
    transactions_count INT;
    budgets_count INT;
    transferts_count INT;
    total_records INT;
    start_time TIMESTAMP;
    duration_ms INT;
BEGIN
    start_time := clock_timestamp();
    
    -- 1. DÉSACTIVER RLS TEMPORAIREMENT
    RAISE NOTICE 'Désactivation de RLS...';
    ALTER TABLE depenses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE notes_depenses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
    ALTER TABLE transferts DISABLE ROW LEVEL SECURITY;
    
    -- 2. COMPTER LES ENREGISTREMENTS
    SELECT COUNT(*) INTO depenses_count FROM depenses;
    SELECT COUNT(*) INTO recettes_count FROM recettes;
    SELECT COUNT(*) INTO notes_count FROM notes_depenses;
    SELECT COUNT(*) INTO categories_count FROM categories;
    SELECT COUNT(*) INTO goals_count FROM goals;
    SELECT COUNT(*) INTO transactions_count FROM transactions;
    SELECT COUNT(*) INTO budgets_count FROM budgets;
    SELECT COUNT(*) INTO transferts_count FROM transferts;
    
    total_records := depenses_count + recettes_count + notes_count + categories_count + goals_count + transactions_count + budgets_count + transferts_count;
    
    -- 3. CRÉER LA SAUVEGARDE
    backup_name := 'auto_backup_with_rls_' || to_char(now(), 'YYYY-MM-DD_HH24-MI-SS');
    
    INSERT INTO backups (name, timestamp, status, tables, data)
    VALUES (
        backup_name, 
        now(), 
        'success', 
        ARRAY['depenses', 'recettes', 'notes_depenses', 'categories', 'goals', 'transactions', 'budgets', 'transferts'],
        jsonb_build_object(
            'depenses', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM depenses t),
            'recettes', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM recettes t),
            'notes_depenses', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM notes_depenses t),
            'categories', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM categories t),
            'goals', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM goals t),
            'transactions', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM transactions t),
            'budgets', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM budgets t),
            'transferts', (SELECT to_jsonb(array_agg(row_to_json(t))) FROM transferts t)
        )
    )
    RETURNING id INTO backup_id;
    
    -- 4. RÉACTIVER RLS IMMÉDIATEMENT
    RAISE NOTICE 'Réactivation de RLS...';
    ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;
    
    -- 5. CALCULER LA DURÉE
    duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
    
    -- 6. CRÉER LES LOGS DÉTAILLÉS
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES (
        'started', 
        'Début de la sauvegarde automatique avec RLS: ' || backup_name,
        backup_id,
        NULL,
        now()
    );
    
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES (
        'success', 
        'Table depenses sauvegardée: ' || depenses_count || ' enregistrements',
        backup_id,
        NULL,
        now()
    );
    
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES (
        'success', 
        'Table recettes sauvegardée: ' || recettes_count || ' enregistrements',
        backup_id,
        NULL,
        now()
    );
    
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES (
        'success', 
        'Table notes_depenses sauvegardée: ' || notes_count || ' enregistrements',
        backup_id,
        NULL,
        now()
    );
    
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES (
        'success', 
        'Sauvegarde automatique confirmée: ' || backup_name || 
        ' | Tables: 8 | Total: ' || total_records || ' enregistrements | RLS réactivé automatiquement',
        backup_id,
        duration_ms,
        now()
    );
    
    -- 7. AFFICHER LE RÉSUMÉ
    RAISE NOTICE 'Sauvegarde automatique terminée: % (ID: %)', backup_name, backup_id;
    RAISE NOTICE 'Durée: % ms', duration_ms;
    RAISE NOTICE 'Enregistrements sauvegardés: %', total_records;
    RAISE NOTICE 'RLS réactivé automatiquement sur toutes les tables';
    
END $$;

-- 8. VÉRIFIER QUE RLS EST RÉACTIVÉ
SELECT 
    'VÉRIFICATION RLS' as test,
    schemaname,
    tablename,
    rowsecurity as rls_active
FROM pg_tables 
WHERE tablename IN ('depenses', 'recettes', 'notes_depenses', 'categories', 'goals', 'transactions', 'budgets', 'transferts')
ORDER BY tablename;

-- 9. AFFICHER LA SAUVEGARDE CRÉÉE
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






















