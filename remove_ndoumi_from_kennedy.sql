-- Supprimer la liaison de "N'DOUMI : Indemnité Transport Septembre 2025" 
-- de la recette "Loyer Kennedy : Mois de Octobre 2025"

-- D'abord, identifier la recette Kennedy
SELECT 
    'RECETTE KENNEDY TROUVÉE' as info,
    id,
    description,
    amount,
    solde_disponible
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND description LIKE '%Kennedy%'
ORDER BY created_at DESC
LIMIT 1;

-- Supprimer la liaison de N'DOUMI
UPDATE depenses 
SET recette_id = NULL
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND libelle = 'N''DOUMI : Indemnité Transport Septembre 2025'
AND recette_id IN (
    SELECT id 
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND description LIKE '%Kennedy%'
);

-- Vérifier que la liaison a été supprimée
SELECT 
    'VÉRIFICATION APRÈS SUPPRESSION' as info,
    COUNT(*) as depenses_liees_kennedy
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND r.description LIKE '%Kennedy%';


