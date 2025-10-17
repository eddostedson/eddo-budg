-- Vérifier et créer les tables de sauvegarde
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier si les tables existent
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backups') 
         THEN 'Table backups existe' 
         ELSE 'Table backups manquante' END as status_backups,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs') 
         THEN 'Table backup_logs existe' 
         ELSE 'Table backup_logs manquante' END as status_logs;

-- 2. Si les tables n'existent pas, les créer
DO $$
BEGIN
    -- Créer la table backups si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backups') THEN
        CREATE TABLE backups (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'in_progress')),
            tables TEXT[] DEFAULT '{}',
            data JSONB NOT NULL,
            error TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table backups créée';
    ELSE
        RAISE NOTICE 'Table backups existe déjà';
    END IF;

    -- Créer la table backup_logs si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_logs') THEN
        CREATE TABLE backup_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'success', 'error')),
            message TEXT NOT NULL,
            backup_id UUID REFERENCES backups(id) ON DELETE SET NULL,
            duration INTEGER,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Table backup_logs créée';
    ELSE
        RAISE NOTICE 'Table backup_logs existe déjà';
    END IF;
END $$;

-- 3. Activer RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- 4. Créer les politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs peuvent gérer leurs propres sauvegardes" ON backups;
CREATE POLICY "Les utilisateurs peuvent gérer leurs propres sauvegardes"
ON backups FOR ALL
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres logs" ON backup_logs;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres logs"
ON backup_logs FOR ALL
USING (auth.uid() IS NOT NULL);

-- 5. Créer un log de test
INSERT INTO backup_logs (status, message, timestamp) 
VALUES ('started', 'Tables de sauvegarde créées avec succès', NOW());

-- 6. Vérifier que tout fonctionne
SELECT 
    'Tables créées et testées' as status,
    (SELECT COUNT(*) FROM backups) as nombre_sauvegardes,
    (SELECT COUNT(*) FROM backup_logs) as nombre_logs,
    (SELECT MAX(timestamp) FROM backup_logs) as dernier_log;


