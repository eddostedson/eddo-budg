-- Forcer la création d'un log de sauvegarde
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Créer un log de test
INSERT INTO backup_logs (
    status,
    message,
    backup_id,
    duration,
    timestamp
) VALUES (
    'started',
    'Test du système de sauvegarde - Démarrage',
    NULL,
    NULL,
    NOW()
);

-- 2. Créer un log de succès
INSERT INTO backup_logs (
    status,
    message,
    backup_id,
    duration,
    timestamp
) VALUES (
    'success',
    'Test du système de sauvegarde - Terminé avec succès',
    NULL,
    1500,
    NOW()
);

-- 3. Créer un log d'erreur de test
INSERT INTO backup_logs (
    status,
    message,
    backup_id,
    duration,
    timestamp
) VALUES (
    'error',
    'Test du système de sauvegarde - Erreur simulée',
    NULL,
    500,
    NOW()
);

-- 4. Vérifier que les logs ont été créés
SELECT 
    id,
    status,
    message,
    duration,
    timestamp
FROM backup_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- 5. Afficher le résumé
SELECT 
    'Logs de test créés' as status,
    COUNT(*) as total_logs,
    COUNT(CASE WHEN status = 'started' THEN 1 END) as logs_started,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as logs_success,
    COUNT(CASE WHEN status = 'error' THEN 1 END) as logs_error
FROM backup_logs;























