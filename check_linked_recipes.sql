-- Vérifier quelles recettes ont maintenant des dépenses liées
SELECT 
    'RECETTES AVEC DÉPENSES' as info,
    r.description,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depense_attendue,
    COUNT(d.id) as nombre_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    CASE 
        WHEN COUNT(d.id) > 0 THEN '✅ AVEC DÉPENSES'
        ELSE '❌ SANS DÉPENSES'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.amount DESC;


