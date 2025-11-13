-- Système de sauvegarde automatique pour les données
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Créer une fonction de sauvegarde automatique
CREATE OR REPLACE FUNCTION create_backup_table(table_name text)
RETURNS void AS $$
DECLARE
    backup_table_name text;
    sql_query text;
BEGIN
    backup_table_name := table_name || '_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS');
    
    -- Créer la table de sauvegarde avec la même structure
    sql_query := 'CREATE TABLE ' || backup_table_name || ' AS SELECT * FROM ' || table_name;
    EXECUTE sql_query;
    
    RAISE NOTICE 'Sauvegarde créée: %', backup_table_name;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer une fonction pour sauvegarder toutes les tables importantes
CREATE OR REPLACE FUNCTION backup_all_important_tables()
RETURNS void AS $$
BEGIN
    -- Sauvegarder les tables importantes
    PERFORM create_backup_table('notes_depenses');
    PERFORM create_backup_table('depenses');
    PERFORM create_backup_table('recettes');
    
    RAISE NOTICE 'Sauvegarde complète terminée';
END;
$$ LANGUAGE plpgsql;

-- 3. Créer un trigger pour sauvegarde automatique sur notes_depenses
CREATE OR REPLACE FUNCTION trigger_backup_notes()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une sauvegarde avant chaque modification importante
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        INSERT INTO notes_depenses_backup_log (
            operation_type,
            old_data,
            new_data,
            timestamp
        ) VALUES (
            TG_OP,
            row_to_json(OLD),
            row_to_json(NEW),
            NOW()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une table de log pour les sauvegardes
CREATE TABLE IF NOT EXISTS notes_depenses_backup_log (
    id SERIAL PRIMARY KEY,
    operation_type TEXT,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer le trigger
DROP TRIGGER IF EXISTS trigger_backup_notes_changes ON notes_depenses;
CREATE TRIGGER trigger_backup_notes_changes
    AFTER INSERT OR UPDATE OR DELETE ON notes_depenses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_backup_notes();

-- 6. Créer une fonction pour restaurer depuis une sauvegarde
CREATE OR REPLACE FUNCTION restore_from_backup(backup_table_name text)
RETURNS void AS $$
DECLARE
    sql_query text;
BEGIN
    -- Vider la table actuelle
    TRUNCATE TABLE notes_depenses;
    
    -- Restaurer depuis la sauvegarde
    sql_query := 'INSERT INTO notes_depenses SELECT * FROM ' || backup_table_name;
    EXECUTE sql_query;
    
    RAISE NOTICE 'Données restaurées depuis: %', backup_table_name;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer une sauvegarde initiale maintenant
SELECT backup_all_important_tables();

-- 8. Afficher les tables de sauvegarde créées
SELECT 
    table_name,
    'Sauvegarde créée' as status
FROM information_schema.tables 
WHERE table_name LIKE '%_backup_%'
ORDER BY table_name;





























