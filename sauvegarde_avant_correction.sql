-- ═══════════════════════════════════════════════════════════════════════════
-- 💾 SAUVEGARDE AVANT CORRECTION
-- ═══════════════════════════════════════════════════════════════════════════
-- Créer une table de sauvegarde des liaisons actuelles
-- ═══════════════════════════════════════════════════════════════════════════

-- Sauvegarder l'état actuel des liaisons
CREATE TABLE IF NOT EXISTS depenses_backup_liaisons AS
SELECT 
    id,
    recette_id,
    libelle,
    montant,
    date,
    NOW() as backup_date
FROM depenses;

SELECT 
    '✅ SAUVEGARDE CRÉÉE' as statut,
    COUNT(*) as nb_depenses_sauvegardees
FROM depenses_backup_liaisons;

-- Pour RESTAURER si besoin (NE PAS EXÉCUTER MAINTENANT) :
-- UPDATE depenses d
-- SET recette_id = b.recette_id
-- FROM depenses_backup_liaisons b
-- WHERE d.id = b.id;


