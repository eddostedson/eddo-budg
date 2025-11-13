-- ═══════════════════════════════════════════════════════════════════════════
-- 🔄 RESTAURER LES BACKUPS
-- ═══════════════════════════════════════════════════════════════════════════

-- Restaurer les dépenses (uniquement les liaisons)
UPDATE depenses d
SET recette_id = b.recette_id
FROM depenses_backup_complete b
WHERE d.id = b.id;

SELECT '✅ Backups restaurés' as statut;

-- Vérification
SELECT 
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees_apres_restauration
FROM depenses;


