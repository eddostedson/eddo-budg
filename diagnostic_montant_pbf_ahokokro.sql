-- 🔍 DIAGNOSTIC MONTANT PBF AHOKOKRO
-- Vérifier le montant actuel en base de données

SELECT 
    'MONTANT ACTUEL EN BASE' as info,
    libelle,
    amount as montant_initial,
    solde_disponible as solde_actuel,
    updated_at as derniere_maj
FROM recettes 
WHERE libelle LIKE '%PBF Ahokokro%'
ORDER BY created_at DESC;

-- Vérifier les dépenses liées à cette recette
SELECT 
    'DÉPENSES LIÉES' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_depenses
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.libelle LIKE '%PBF Ahokokro%';

-- Calculer le solde correct
SELECT 
    'CALCUL SOLDE CORRECT' as info,
    r.libelle,
    r.amount as montant_initial,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.libelle LIKE '%PBF Ahokokro%'
GROUP BY r.id, r.libelle, r.amount;
