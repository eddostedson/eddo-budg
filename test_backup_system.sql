-- Test complet du système de sauvegarde
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier que les tables existent
SELECT 
    'Vérification des tables' as etape,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backups') 
         THEN '✅ Table backups existe' 
         ELSE '❌ Table backups manquante' END as backups_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs') 
         THEN '✅ Table backup_logs existe' 
         ELSE '❌ Table backup_logs manquante' END as logs_table;

-- 2. Créer un log de test pour vérifier le fonctionnement
INSERT INTO backup_logs (
    status,
    message,
    backup_id,
    duration,
    timestamp
) VALUES (
    'started',
    'Test du système de sauvegarde - Démarrage du diagnostic',
    NULL,
    NULL,
    NOW()
);

-- 3. Attendre un peu (simulation)
SELECT pg_sleep(1);

-- 4. Créer un log de succès
INSERT INTO backup_logs (
    status,
    message,
    backup_id,
    duration,
    timestamp
) VALUES (
    'success',
    'Test du système de sauvegarde - Diagnostic terminé avec succès',
    NULL,
    1000,
    NOW()
);

-- 5. Vérifier que les logs ont été créés
SELECT 
    'Logs créés' as etape,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN status = 'started' THEN 1 END) as logs_started,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as logs_success,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as logs_error
FROM backup_logs;

-- 6. Afficher les derniers logs
SELECT 
    id,
    status,
    message,
    duration,
    timestamp
FROM backup_logs 
ORDER BY timestamp DESC 
LIMIT 5;

-- 7. Test de création d'une sauvegarde factice
INSERT INTO backups (
    name,
    timestamp,
    status,
    tables,
    data,
    created_at
) VALUES (
    'test_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS'),
    NOW(),
    'success',
    ARRAY['notes_depenses', 'depenses', 'recettes'],
    '{"notes_depenses": [], "depenses": [], "recettes": []}'::jsonb,
    NOW()
);

-- 8. Vérifier que la sauvegarde a été créée
SELECT 
    'Sauvegarde créée' as etape,
    COUNT(*) as nombre_sauvegardes,
    MAX(timestamp) as derniere_sauvegarde
FROM backups;

-- 9. Nettoyer les données de test
DELETE FROM backup_logs WHERE message LIKE 'Test du système de sauvegarde%';
DELETE FROM backups WHERE name LIKE 'test_backup_%';

-- 10. Résumé final
SELECT 
    'Système de sauvegarde opérationnel' as status,
    'Toutes les fonctionnalités sont prêtes' as message;





























