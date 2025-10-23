-- SAUVEGARDES AUTOMATIQUES POUR SÉCURITÉ
-- À exécuter dans Supabase SQL Editor

-- 1. CRÉER UNE TABLE DE SAUVEGARDE AUTOMATIQUE
CREATE TABLE IF NOT EXISTS recettes_backup_auto (
    id UUID PRIMARY KEY,
    recette_id UUID,
    description TEXT,
    amount NUMERIC,
    solde_disponible NUMERIC,
    backup_reason TEXT,
    backup_date TIMESTAMP DEFAULT NOW(),
    user_id UUID
);

-- 2. FONCTION DE SAUVEGARDE AUTOMATIQUE
CREATE OR REPLACE FUNCTION auto_backup_recette()
RETURNS TRIGGER AS $$
BEGIN
    -- Sauvegarder avant toute modification
    INSERT INTO recettes_backup_auto (
        recette_id,
        description,
        amount,
        solde_disponible,
        backup_reason,
        user_id
    ) VALUES (
        NEW.id,
        NEW.description,
        NEW.amount,
        NEW.solde_disponible,
        'SAUVEGARDE AUTOMATIQUE AVANT MODIFICATION',
        NEW.user_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER DE SAUVEGARDE AUTOMATIQUE
CREATE TRIGGER trigger_auto_backup_recette
    BEFORE UPDATE ON recettes
    FOR EACH ROW
    EXECUTE FUNCTION auto_backup_recette();

-- 4. FONCTION DE RESTAURATION
CREATE OR REPLACE FUNCTION restore_recette_from_backup(recette_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    backup_record RECORD;
BEGIN
    -- Récupérer la dernière sauvegarde
    SELECT * INTO backup_record
    FROM recettes_backup_auto
    WHERE recette_id = recette_uuid
    ORDER BY backup_date DESC
    LIMIT 1;
    
    IF backup_record IS NULL THEN
        RAISE EXCEPTION 'Aucune sauvegarde trouvée pour la recette %', recette_uuid;
    END IF;
    
    -- Restaurer la recette
    UPDATE recettes 
    SET 
        description = backup_record.description,
        amount = backup_record.amount,
        solde_disponible = backup_record.solde_disponible,
        updated_at = NOW()
    WHERE id = recette_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. FONCTION DE VÉRIFICATION DES SAUVEGARDES
CREATE OR REPLACE FUNCTION check_backup_integrity()
RETURNS TABLE (
    total_backups BIGINT,
    latest_backup TIMESTAMP,
    backup_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        MAX(backup_date) as latest_backup,
        CASE 
            WHEN COUNT(*) > 0 THEN '✅ Sauvegardes disponibles'
            ELSE '⚠️ Aucune sauvegarde'
        END as backup_status
    FROM recettes_backup_auto;
END;
$$ LANGUAGE plpgsql;
