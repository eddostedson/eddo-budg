-- Vérifier les liaisons de la recette "Loyer Kennedy : Mois de Octobre 2025"
SELECT 
    'RECETTE KENNEDY' as info,
    r.id as recette_id,
    r.description,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depense_attendue
FROM recettes r
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND r.description LIKE '%Kennedy%'
ORDER BY r.created_at DESC;

-- Vérifier les dépenses liées à cette recette
SELECT 
    'DÉPENSES LIÉES À KENNEDY' as info,
    d.id as depense_id,
    d.libelle,
    d.montant,
    d.recette_id,
    d.created_at
FROM depenses d
WHERE d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND d.recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND r.description LIKE '%Kennedy%'
)
ORDER BY d.created_at DESC;


