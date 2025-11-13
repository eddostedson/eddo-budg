-- Correction précise des liaisons Kennedy
-- Garder seulement les bonnes liaisons et supprimer les mauvaises

DO $$
DECLARE
    recette_novembre_id UUID;
    recette_octobre_id UUID;
    total_supprimees INTEGER := 0;
BEGIN
    -- Trouver les IDs des recettes Kennedy
    SELECT id INTO recette_novembre_id
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND description = 'Loyer Kennedy : Novembre 2025';
    
    SELECT id INTO recette_octobre_id
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND description = 'Loyer Kennedy : Mois de Octobre 2025';
    
    RAISE NOTICE 'Recette Novembre ID: %', recette_novembre_id;
    RAISE NOTICE 'Recette Octobre ID: %', recette_octobre_id;
    
    -- Supprimer toutes les liaisons incorrectes des recettes Kennedy
    UPDATE depenses 
    SET recette_id = NULL
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND recette_id IN (recette_novembre_id, recette_octobre_id);
    
    -- Lier "Namory" à "Loyer Kennedy : Novembre 2025"
    UPDATE depenses 
    SET recette_id = recette_novembre_id
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND libelle = 'Namory'
    AND montant = 30000.00;
    
    -- Lier "Abbatage d'arbre Miason Kennedy" à "Loyer Kennedy : Mois de Octobre 2025"
    UPDATE depenses 
    SET recette_id = recette_octobre_id
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND libelle = 'Abbatage d''arbre Miason Kennedy'
    AND montant = 30300.00;
    
    RAISE NOTICE 'Correction terminée!';
END $$;

-- Vérifier les résultats
SELECT 
    'VÉRIFICATION FINALE' as info,
    r.description,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depense_attendue,
    COUNT(d.id) as nombre_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND r.description LIKE '%Kennedy%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.created_at DESC;


