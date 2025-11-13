-- ═══════════════════════════════════════════════════════════════════════════
-- 💾 SAUVEGARDE COMPLÈTE DANS SUPABASE (TABLES DE BACKUP)
-- ═══════════════════════════════════════════════════════════════════════════
-- Cette méthode crée des tables de sauvegarde directement dans Supabase
-- Vos données sont sauvegardées et peuvent être restaurées facilement
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 🗑️ ÉTAPE 1 : Supprimer les anciennes sauvegardes (si elles existent)
-- ═══════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS recettes_backup_complete;
DROP TABLE IF EXISTS depenses_backup_complete;

SELECT '🗑️ Anciennes sauvegardes supprimées' as etape;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💾 ÉTAPE 2 : Créer les nouvelles sauvegardes
-- ═══════════════════════════════════════════════════════════════════════════

-- Sauvegarder toutes les RECETTES
CREATE TABLE recettes_backup_complete AS
SELECT * FROM recettes;

-- Sauvegarder toutes les DÉPENSES
CREATE TABLE depenses_backup_complete AS
SELECT * FROM depenses;

SELECT '✅ Nouvelles sauvegardes créées' as etape;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 ÉTAPE 3 : Vérifier les sauvegardes
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '📊 VÉRIFICATION DES SAUVEGARDES' as titre;

SELECT 
    'RECETTES' as table_sauvegardee,
    COUNT(*) as nb_lignes_sauvegardees,
    SUM(amount) as montant_total,
    NOW() as date_sauvegarde
FROM recettes_backup_complete

UNION ALL

SELECT 
    'DÉPENSES' as table_sauvegardee,
    COUNT(*) as nb_lignes_sauvegardees,
    SUM(montant) as montant_total,
    NOW() as date_sauvegarde
FROM depenses_backup_complete;

-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ SAUVEGARDE TERMINÉE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '══════════════════════════════════════' as separateur,
    '✅ SAUVEGARDE COMPLÈTE RÉUSSIE !' as statut;

SELECT 
    '💡 POUR RESTAURER (en cas de besoin)' as info;

SELECT 
    'RECETTES : DELETE FROM recettes; INSERT INTO recettes SELECT * FROM recettes_backup_complete;' as commande_restauration_recettes,
    'DÉPENSES : DELETE FROM depenses; INSERT INTO depenses SELECT * FROM depenses_backup_complete;' as commande_restauration_depenses;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 NOTE IMPORTANTE
-- ═══════════════════════════════════════════════════════════════════════════
-- Les tables "recettes_backup_complete" et "depenses_backup_complete" 
-- contiennent maintenant TOUTES vos données
-- 
-- Vous pouvez maintenant exécuter "correction_intelligente_finale.sql"
-- en toute sécurité !
-- ═══════════════════════════════════════════════════════════════════════════


