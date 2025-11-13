-- ═══════════════════════════════════════════════════════════════════════════
-- ✅ VÉRIFIER QUE LA SAUVEGARDE A BIEN ÉTÉ CRÉÉE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '✅ VÉRIFICATION DE LA SAUVEGARDE' as titre;

-- Comparer les tables originales et les backups
SELECT 
    'RECETTES' as table_name,
    (SELECT COUNT(*) FROM recettes) as nb_original,
    (SELECT COUNT(*) FROM recettes_backup_complete) as nb_backup,
    CASE 
        WHEN (SELECT COUNT(*) FROM recettes) = (SELECT COUNT(*) FROM recettes_backup_complete) 
        THEN '✅ BACKUP OK'
        ELSE '❌ PROBLÈME'
    END as statut
    
UNION ALL

SELECT 
    'DÉPENSES' as table_name,
    (SELECT COUNT(*) FROM depenses) as nb_original,
    (SELECT COUNT(*) FROM depenses_backup_complete) as nb_backup,
    CASE 
        WHEN (SELECT COUNT(*) FROM depenses) = (SELECT COUNT(*) FROM depenses_backup_complete) 
        THEN '✅ BACKUP OK'
        ELSE '❌ PROBLÈME'
    END as statut;

-- Afficher le message de confirmation
SELECT 
    '══════════════════════════════════════' as separateur;

SELECT 
    '🎉 SI LES 2 STATUTS SONT "✅ BACKUP OK"' as message,
    'VOUS POUVEZ MAINTENANT EXÉCUTER' as action,
    'correction_intelligente_finale.sql' as script_suivant,
    'EN TOUTE SÉCURITÉ !' as confirmation;


