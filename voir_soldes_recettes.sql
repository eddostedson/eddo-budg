-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 AFFICHER TOUS LES SOLDES DES RECETTES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    id,
    description as recette,
    amount as montant_recette,
    solde_disponible,
    (amount - solde_disponible) as total_depenses_attendu,
    receipt_date as date_recette,
    TO_CHAR(receipt_date, 'YYYY-MM') as mois
FROM recettes
ORDER BY receipt_date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RÉSUMÉ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '📊 RÉSUMÉ' as section,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_montant_recettes,
    SUM(solde_disponible) as total_solde_disponible,
    SUM(amount - solde_disponible) as total_depenses_attendu
FROM recettes;


