-- ═══════════════════════════════════════════════════════════════════════════
-- 👀 VOIR LES DONNÉES SAUVEGARDÉES
-- ═══════════════════════════════════════════════════════════════════════════

-- Afficher les noms des tables de backup
SELECT 
    '📋 TABLES DE BACKUP CRÉÉES' as titre;

SELECT 
    'recettes_backup_complete' as nom_table,
    COUNT(*) as nb_lignes,
    SUM(amount) as total_montant
FROM recettes_backup_complete

UNION ALL

SELECT 
    'depenses_backup_complete' as nom_table,
    COUNT(*) as nb_lignes,
    SUM(montant) as total_montant
FROM depenses_backup_complete;

-- Afficher quelques exemples de recettes sauvegardées
SELECT 
    '══════════════════════════════════════' as separateur,
    '💰 EXEMPLES DE RECETTES SAUVEGARDÉES' as titre;

SELECT 
    description,
    amount,
    solde_disponible,
    receipt_date
FROM recettes_backup_complete
ORDER BY receipt_date DESC
LIMIT 5;

-- Afficher quelques exemples de dépenses sauvegardées
SELECT 
    '══════════════════════════════════════' as separateur,
    '💸 EXEMPLES DE DÉPENSES SAUVEGARDÉES' as titre;

SELECT 
    libelle,
    montant,
    date,
    recette_id
FROM depenses_backup_complete
ORDER BY date DESC
LIMIT 5;


