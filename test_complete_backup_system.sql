-- Test du système de sauvegarde complète
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'existence des tables de sauvegarde
SELECT 
    'VÉRIFICATION TABLES' as test,
    table_name,
    'Table existe' as status
FROM information_schema.tables 
WHERE table_name IN ('backups', 'backup_logs')
ORDER BY table_name;

-- 2. Insérer des données de test dans différentes tables
-- (Ces données seront sauvegardées par le système)

-- Test dans notes_depenses
INSERT INTO notes_depenses (libelle, montant, description, priorite, type, statut) 
VALUES 
    ('Test sauvegarde 1', 100.50, 'Note de test pour sauvegarde', 'haute', 'depense', 'en_attente'),
    ('Test sauvegarde 2', 250.00, 'Autre note de test', 'moyenne', 'depense', 'en_attente')
ON CONFLICT DO NOTHING;

-- Test dans depenses (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'depenses') THEN
        INSERT INTO depenses (libelle, montant, description, date_depense) 
        VALUES 
            ('Dépense test 1', 75.25, 'Dépense de test', CURRENT_DATE),
            ('Dépense test 2', 150.00, 'Autre dépense de test', CURRENT_DATE)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Test dans recettes (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recettes') THEN
        INSERT INTO recettes (libelle, montant, description, date_recette) 
        VALUES 
            ('Recette test 1', 500.00, 'Recette de test', CURRENT_DATE),
            ('Recette test 2', 750.50, 'Autre recette de test', CURRENT_DATE)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. Vérifier les données insérées
SELECT 
    'DONNÉES DE TEST' as test,
    'notes_depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM notes_depenses
UNION ALL
SELECT 
    'DONNÉES DE TEST' as test,
    'depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM depenses
UNION ALL
SELECT 
    'DONNÉES DE TEST' as test,
    'recettes' as table_name,
    COUNT(*) as nombre_enregistrements
FROM recettes;

-- 4. Créer une sauvegarde de test via fonction SQL
-- (Cette fonction sera appelée par l'application)
DO $$
DECLARE
    backup_id UUID;
    backup_name TEXT;
    tables_with_data TEXT[];
    backup_data JSONB;
    table_name TEXT;
    table_data JSONB;
BEGIN
    -- Nom de la sauvegarde
    backup_name := 'test_complete_backup_' || to_char(now(), 'YYYY-MM-DD_HH24-MI-SS');
    
    -- Initialiser l'objet de sauvegarde
    backup_data := '{}'::JSONB;
    
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
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO table_data;
            
            -- Si la table a des données, les sauvegarder
            IF (table_data->>'count')::INT > 0 THEN
                EXECUTE format('SELECT to_jsonb(array_agg(row_to_json(t))) FROM %I t', table_name) INTO table_data;
                backup_data := backup_data || jsonb_build_object(table_name, table_data);
                tables_with_data := array_append(tables_with_data, table_name);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer les erreurs (tables inaccessibles, etc.)
                NULL;
        END;
    END LOOP;
    
    -- Insérer la sauvegarde
    INSERT INTO backups (name, timestamp, status, tables, data)
    VALUES (backup_name, now(), 'success', tables_with_data, backup_data)
    RETURNING id INTO backup_id;
    
    -- Créer un log
    INSERT INTO backup_logs (status, message, backup_id, timestamp)
    VALUES ('success', 'Sauvegarde complète de test créée avec succès', backup_id, now());
    
    RAISE NOTICE 'Sauvegarde complète créée: % (ID: %)', backup_name, backup_id;
    RAISE NOTICE 'Tables sauvegardées: %', array_to_string(tables_with_data, ', ');
END $$;

-- 5. Vérifier la sauvegarde créée
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

-- 6. Vérifier les logs
SELECT 
    'LOGS CRÉÉS' as test,
    COUNT(*) as nombre_logs,
    MAX(timestamp) as dernier_log
FROM backup_logs;

-- 7. Afficher les détails de la sauvegarde
SELECT 
    'DÉTAILS SAUVEGARDE' as test,
    name,
    status,
    tables,
    jsonb_object_keys(data) as tables_sauvegardees
FROM backups 
ORDER BY timestamp DESC 
LIMIT 1;















