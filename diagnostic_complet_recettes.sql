-- Diagnostic complet de toutes les recettes et leurs liaisons
-- Pour identifier les problèmes et les corriger

SELECT 
    'DIAGNOSTIC COMPLET' as info,
    r.description,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depense_attendue,
    COUNT(d.id) as nombre_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    CASE 
        WHEN (r.amount - r.solde_disponible) <= 0 THEN '✅ PAS DE DÉPENSES ATTENDUES'
        WHEN COUNT(d.id) = 0 THEN '❌ DÉPENSES MANQUANTES'
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 0.01 THEN '✅ CORRESPONDANCE EXACTE'
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 100 THEN '✅ CORRESPONDANCE BONNE'
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 1000 THEN '⚠️ CORRESPONDANCE APPROCHÉE'
        ELSE '🔴 CORRESPONDANCE LOINTAINE'
    END as statut_liaison,
    ROUND(
        CASE 
            WHEN (r.amount - r.solde_disponible) > 0 
            THEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) / (r.amount - r.solde_disponible) * 100
            ELSE 0
        END, 2
    ) as pourcentage_ecart
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY 
    CASE 
        WHEN (r.amount - r.solde_disponible) <= 0 THEN 1
        WHEN COUNT(d.id) = 0 THEN 2
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 0.01 THEN 3
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 100 THEN 4
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 1000 THEN 5
        ELSE 6
    END,
    r.amount DESC;