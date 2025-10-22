-- Migration 015 : Création des tables pour le système de sauvegarde
-- Description : Tables pour gérer les sauvegardes automatiques et manuelles

-- 1. Table des sauvegardes
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'in_progress')),
    tables TEXT[] DEFAULT '{}',
    data JSONB NOT NULL,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des logs de sauvegarde
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'success', 'error')),
    message TEXT NOT NULL,
    backup_id UUID REFERENCES backups(id) ON DELETE SET NULL,
    duration INTEGER, -- en millisecondes
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON backups(timestamp);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_timestamp ON backup_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);

-- 4. Activer RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres sauvegardes"
ON backups FOR ALL
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Les utilisateurs peuvent voir leurs propres logs"
ON backup_logs FOR ALL
USING (auth.uid() IS NOT NULL);

-- 6. Trigger pour nettoyer les anciennes sauvegardes (garder seulement les 50 plus récentes)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS TRIGGER AS $$
BEGIN
    -- Supprimer les sauvegardes automatiques de plus de 7 jours
    DELETE FROM backups 
    WHERE name LIKE 'backup_%' 
    AND created_at < NOW() - INTERVAL '7 days';
    
    -- Garder seulement les 50 sauvegardes les plus récentes
    DELETE FROM backups 
    WHERE id NOT IN (
        SELECT id FROM backups 
        ORDER BY created_at DESC 
        LIMIT 50
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger pour nettoyer les anciens logs (garder seulement les 1000 plus récents)
CREATE OR REPLACE FUNCTION cleanup_old_backup_logs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM backup_logs 
    WHERE id NOT IN (
        SELECT id FROM backup_logs 
        ORDER BY timestamp DESC 
        LIMIT 1000
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer les triggers
DROP TRIGGER IF EXISTS trigger_cleanup_old_backups ON backups;
CREATE TRIGGER trigger_cleanup_old_backups
    AFTER INSERT ON backups
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_backups();

DROP TRIGGER IF EXISTS trigger_cleanup_old_backup_logs ON backup_logs;
CREATE TRIGGER trigger_cleanup_old_backup_logs
    AFTER INSERT ON backup_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_backup_logs();

-- 9. Commentaires
COMMENT ON TABLE backups IS 'Table des sauvegardes automatiques et manuelles';
COMMENT ON TABLE backup_logs IS 'Logs des opérations de sauvegarde';
COMMENT ON COLUMN backups.data IS 'Données sauvegardées au format JSON';
COMMENT ON COLUMN backup_logs.duration IS 'Durée de l\'opération en millisecondes';






















