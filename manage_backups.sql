-- Gestion des sauvegardes
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Lister toutes les sauvegardes disponibles
SELECT 
    table_name,
    'Sauvegarde disponible' as status,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as taille
FROM information_schema.tables 
WHERE table_name LIKE '%backup%'
ORDER BY table_name;

-- 2. Voir les détails des sauvegardes de notes
SELECT 
    'notes_depenses_backup_manual' as table_name,
    COUNT(*) as nombre_notes,
    MIN(backup_timestamp) as plus_ancienne,
    MAX(backup_timestamp) as plus_recente
FROM notes_depenses_backup_manual;

-- 3. Fonction pour nettoyer les anciennes sauvegardes (garder seulement les 5 plus récentes)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS void AS $$
DECLARE
    backup_table text;
BEGIN
    -- Supprimer les sauvegardes automatiques de plus de 7 jours
    FOR backup_table IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%_backup_%' 
        AND table_name NOT LIKE '%_manual'
        AND table_name < 'notes_depenses_backup_' || to_char(now() - interval '7 days', 'YYYY_MM_DD')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || backup_table;
        RAISE NOTICE 'Ancienne sauvegarde supprimée: %', backup_table;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Afficher les instructions d'utilisation
SELECT 
    'Instructions de sauvegarde:' as info,
    '1. Exécutez manual_backup.sql régulièrement' as etape1,
    '2. Gardez les sauvegardes dans un endroit sûr' as etape2,
    '3. Testez la restauration périodiquement' as etape3;





























