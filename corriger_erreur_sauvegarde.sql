-- 🚨 CORRECTION DE L'ERREUR DE SAUVEGARDE
-- À exécuter dans Supabase SQL Editor

-- 1. DÉSACTIVER TEMPORAIREMENT LE TRIGGER DE SAUVEGARDE
DROP TRIGGER IF EXISTS trigger_auto_backup_recette ON recettes;

-- 2. CORRIGER LA FONCTION DE SAUVEGARDE
CREATE OR REPLACE FUNCTION auto_backup_recette()
RETURNS TRIGGER AS $$
BEGIN
    -- Sauvegarder avant toute modification (avec ID généré)
    INSERT INTO recettes_backup_auto (
        id,
        recette_id,
        description,
        amount,
        solde_disponible,
        backup_reason,
        user_id
    ) VALUES (
        gen_random_uuid(), -- Générer un ID unique
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

-- 3. RECRÉER LE TRIGGER DE SAUVEGARDE (CORRIGÉ)
CREATE TRIGGER trigger_auto_backup_recette
    BEFORE UPDATE ON recettes
    FOR EACH ROW
    EXECUTE FUNCTION auto_backup_recette();

-- 4. MAINTENANT, RECALCULER LE SOLDE DISPONIBLE
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0),
    updated_at = NOW();

-- 5. VÉRIFIER LES RÉSULTATS
SELECT 
    'SOLDE DISPONIBLE CORRIGÉ' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees
FROM recettes;
