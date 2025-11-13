-- Vérification finale après correction globale
SELECT 
    'STATUT FINAL APRÈS CORRECTION' as info,
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
    END as statut_liaison
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.amount DESC;


