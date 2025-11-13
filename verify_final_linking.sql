-- Vérification finale de la liaison des dépenses aux recettes
-- Pour confirmer que tout fonctionne correctement

-- 1. Statistiques générales
SELECT 
    'STATISTIQUES GÉNÉRALES' as info,
    (SELECT COUNT(*) FROM recettes WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19') as total_recettes,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19') as total_depenses,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' AND recette_id IS NOT NULL) as depenses_liees,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' AND recette_id IS NULL) as depenses_non_liees;

-- 2. Recettes avec leurs dépenses liées
SELECT 
    'RECETTES AVEC DÉPENSES' as info,
    r.description,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depense_attendue,
    COUNT(d.id) as nombre_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.amount DESC;

-- 3. Dépenses non liées (s'il y en a)
SELECT 
    'DÉPENSES NON LIÉES' as info,
    libelle,
    montant,
    created_at
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NULL
ORDER BY montant DESC
LIMIT 10;


