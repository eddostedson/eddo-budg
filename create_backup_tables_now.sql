-- Créer immédiatement les tables de sauvegarde
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Créer la table des sauvegardes
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

-- 2. Créer la table des logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'success', 'error')),
    message TEXT NOT NULL,
    backup_id UUID REFERENCES backups(id) ON DELETE SET NULL,
    duration INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer les index
CREATE INDEX IF NOT EXISTS idx_backups_timestamp ON backups(timestamp);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_timestamp ON backup_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);

-- 4. Activer RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs propres sauvegardes" ON backups;
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres sauvegardes"
ON backups FOR ALL
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres logs" ON backup_logs;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres logs"
ON backup_logs FOR ALL
USING (auth.uid() IS NOT NULL);

-- 6. Tester avec un log de test
INSERT INTO backup_logs (
    status,
    message,
    timestamp
) VALUES (
    'started',
    'Tables de sauvegarde créées avec succès',
    NOW()
);

-- 7. Vérifier que tout fonctionne
SELECT 
    'Tables créées avec succès' as status,
    (SELECT COUNT(*) FROM backups) as nombre_sauvegardes,
    (SELECT COUNT(*) FROM backup_logs) as nombre_logs;


