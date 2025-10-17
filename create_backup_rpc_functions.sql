-- Créer les fonctions RPC pour la sauvegarde avec gestion RLS
-- À exécuter dans Supabase SQL Editor

-- 1. Fonction pour désactiver RLS temporairement
CREATE OR REPLACE FUNCTION disable_rls_for_backup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Désactiver RLS sur toutes les tables de sauvegarde
    ALTER TABLE depenses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;
    ALTER TABLE notes_depenses DISABLE ROW LEVEL SECURITY;
    ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
    ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
    ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
    ALTER TABLE transferts DISABLE ROW LEVEL SECURITY;
    
    RETURN 'RLS désactivé temporairement pour la sauvegarde';
END;
$$;

-- 2. Fonction pour réactiver RLS
CREATE OR REPLACE FUNCTION enable_rls_for_backup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Réactiver RLS sur toutes les tables
    ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;
    
    RETURN 'RLS réactivé après la sauvegarde';
END;
$$;

-- 3. Fonction pour créer une sauvegarde complète avec gestion RLS
CREATE OR REPLACE FUNCTION create_complete_backup_with_rls(backup_name TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    backup_id UUID;
    final_backup_name TEXT;
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
    result JSONB;
BEGIN
    start_time := clock_timestamp();
    
    -- Nom de la sauvegarde
    final_backup_name := COALESCE(backup_name, 'app_backup_' || to_char(now(), 'YYYY-MM-DD_HH24-MI-SS'));
    
    -- 1. Désactiver RLS temporairement
    PERFORM disable_rls_for_backup();
    
    -- 2. Compter les enregistrements
    SELECT COUNT(*) INTO depenses_count FROM depenses;
    SELECT COUNT(*) INTO recettes_count FROM recettes;
    SELECT COUNT(*) INTO notes_count FROM notes_depenses;
    SELECT COUNT(*) INTO categories_count FROM categories;
    SELECT COUNT(*) INTO goals_count FROM goals;
    SELECT COUNT(*) INTO transactions_count FROM transactions;
    SELECT COUNT(*) INTO budgets_count FROM budgets;
    SELECT COUNT(*) INTO transferts_count FROM transferts;
    
    total_records := depenses_count + recettes_count + notes_count + categories_count + goals_count + transactions_count + budgets_count + transferts_count;
    
    -- 3. Créer la sauvegarde
    INSERT INTO backups (name, timestamp, status, tables, data)
    VALUES (
        final_backup_name, 
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
    
    -- 4. Réactiver RLS immédiatement
    PERFORM enable_rls_for_backup();
    
    -- 5. Calculer la durée
    duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
    
    -- 6. Créer les logs
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES 
        ('started', 'Début de la sauvegarde depuis l''application: ' || final_backup_name, backup_id, NULL, now()),
        ('success', 'Table depenses sauvegardée: ' || depenses_count || ' enregistrements', backup_id, NULL, now()),
        ('success', 'Table recettes sauvegardée: ' || recettes_count || ' enregistrements', backup_id, NULL, now()),
        ('success', 'Table notes_depenses sauvegardée: ' || notes_count || ' enregistrements', backup_id, NULL, now()),
        ('success', 'Sauvegarde depuis l''application confirmée: ' || final_backup_name || ' | Tables: 8 | Total: ' || total_records || ' enregistrements | RLS réactivé automatiquement', backup_id, duration_ms, now());
    
    -- 7. Retourner le résultat
    result := jsonb_build_object(
        'success', true,
        'backup_id', backup_id,
        'backup_name', final_backup_name,
        'total_records', total_records,
        'duration_ms', duration_ms,
        'tables', jsonb_build_object(
            'depenses', depenses_count,
            'recettes', recettes_count,
            'notes_depenses', notes_count,
            'categories', categories_count,
            'goals', goals_count,
            'transactions', transactions_count,
            'budgets', budgets_count,
            'transferts', transferts_count
        )
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- S'assurer que RLS est réactivé même en cas d'erreur
        PERFORM enable_rls_for_backup();
        RAISE;
END;
$$;

-- 4. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION disable_rls_for_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION enable_rls_for_backup() TO authenticated;
GRANT EXECUTE ON FUNCTION create_complete_backup_with_rls(TEXT) TO authenticated;

-- 5. Tester les fonctions
SELECT 'FONCTIONS CRÉÉES' as test, 'Prêtes à être utilisées depuis l''application' as status;















