-- Test des logs détaillés de sauvegarde
-- À exécuter dans Supabase SQL Editor

-- 1. Créer des données de test dans différentes tables
INSERT INTO notes_depenses (libelle, montant, description, priorite, type, statut) 
VALUES 
    ('Test logs détaillés 1', 150.75, 'Note de test pour logs détaillés', 'haute', 'depense', 'en_attente'),
    ('Test logs détaillés 2', 300.00, 'Autre note de test', 'moyenne', 'depense', 'en_attente'),
    ('Test logs détaillés 3', 75.25, 'Troisième note', 'basse', 'depense', 'en_attente'),
    ('Test logs détaillés 4', 200.50, 'Quatrième note', 'haute', 'depense', 'en_attente')
ON CONFLICT DO NOTHING;

-- 2. Créer une sauvegarde de test avec logs détaillés
DO $$
DECLARE
    backup_id UUID;
    backup_name TEXT;
    tables_with_data TEXT[];
    backup_data JSONB;
    table_name TEXT;
    table_data JSONB;
    record_count INT;
    table_size INT;
    total_records INT := 0;
    total_size INT := 0;
    table_details TEXT;
    start_time TIMESTAMP;
    duration_ms INT;
BEGIN
    start_time := clock_timestamp();
    
    -- Nom de la sauvegarde
    backup_name := 'test_detailed_logs_' || to_char(now(), 'YYYY-MM-DD_HH24-MI-SS');
    
    -- Initialiser l'objet de sauvegarde
    backup_data := '{}'::JSONB;
    tables_with_data := ARRAY[]::TEXT[];
    
    -- Log de début détaillé
    INSERT INTO backup_logs (status, message, timestamp)
    VALUES (
        'started', 
        'Début de la sauvegarde complète: ' || backup_name || ' | Tables détectées: ' || 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('backups', 'backup_logs')),
        now()
    );
    
    -- Vérifier chaque table et sauvegarder les données
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_name NOT IN ('backups', 'backup_logs')
        ORDER BY t.table_name
    LOOP
        BEGIN
            -- Compter les enregistrements
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO record_count;
            
            -- Si la table a des données, les sauvegarder
            IF record_count > 0 THEN
                EXECUTE format('SELECT to_jsonb(array_agg(row_to_json(t))) FROM %I t', table_name) INTO table_data;
                backup_data := backup_data || jsonb_build_object(table_name, table_data);
                tables_with_data := array_append(tables_with_data, table_name);
                
                -- Calculer la taille de la table
                table_size := jsonb_array_length(table_data);
                total_records := total_records + table_size;
                total_size := total_size + pg_column_size(table_data);
                
                -- Log détaillé pour chaque table
                INSERT INTO backup_logs (status, message, timestamp)
                VALUES (
                    'success', 
                    'Table ' || table_name || ' sauvegardée: ' || table_size || ' enregistrements, ' || 
                    ROUND(pg_column_size(table_data)/1024.0, 1) || ' KB',
                    now()
                );
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer les erreurs (tables inaccessibles, etc.)
                NULL;
        END;
    END LOOP;
    
    -- Créer les détails des tables
    table_details := '';
    FOR i IN 1..array_length(tables_with_data, 1) LOOP
        IF i > 1 THEN
            table_details := table_details || ', ';
        END IF;
        table_details := table_details || tables_with_data[i] || '(' || 
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tables_with_data[i]) || ' cols)';
    END LOOP;
    
    -- Insérer la sauvegarde
    INSERT INTO backups (name, timestamp, status, tables, data)
    VALUES (backup_name, now(), 'success', tables_with_data, backup_data)
    RETURNING id INTO backup_id;
    
    -- Calculer la durée
    duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;
    
    -- Log de succès détaillé
    INSERT INTO backup_logs (status, message, backup_id, duration, timestamp)
    VALUES (
        'success', 
        'Sauvegarde complète confirmée: ' || backup_name || ' | Tables: ' || 
        array_length(tables_with_data, 1) || ' | Total: ' || total_records || 
        ' enregistrements, ' || ROUND(total_size/1024.0, 1) || ' KB | Détails: ' || table_details,
        backup_id,
        duration_ms,
        now()
    );
    
    RAISE NOTICE 'Sauvegarde détaillée créée: % (ID: %)', backup_name, backup_id;
    RAISE NOTICE 'Tables sauvegardées: %', array_to_string(tables_with_data, ', ');
    RAISE NOTICE 'Total: % enregistrements, % KB en % ms', total_records, ROUND(total_size/1024.0, 1), duration_ms;
END $$;

-- 3. Afficher les logs détaillés
SELECT 
    'LOGS DÉTAILLÉS' as test,
    status,
    message,
    timestamp,
    duration,
    backup_id
FROM backup_logs 
WHERE message LIKE '%détaillé%' OR message LIKE '%Table%' OR message LIKE '%confirmée%'
ORDER BY timestamp DESC;

-- 4. Afficher les statistiques des logs
SELECT 
    'STATISTIQUES LOGS' as test,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN status = 'started' THEN 1 END) as logs_started,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as logs_success,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as logs_error,
    MAX(timestamp) as dernier_log,
    AVG(duration) as duree_moyenne_ms
FROM backup_logs;

-- 5. Afficher la sauvegarde créée
SELECT 
    'SAUVEGARDE CRÉÉE' as test,
    id,
    name,
    timestamp,
    status,
    array_length(tables, 1) as nombre_tables,
    pg_size_pretty(pg_column_size(data)) as taille_donnees,
    tables
FROM backups 
ORDER BY timestamp DESC 
LIMIT 1;






















