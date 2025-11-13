-- Correction précise de "Loyer Kennedy : Novembre 2025"
-- Garder seulement "Namory" et supprimer les autres

DO $$
DECLARE
    recette_kennedy_nov_id UUID;
    total_supprimees INTEGER := 0;
BEGIN
    -- Trouver l'ID de la recette "Loyer Kennedy : Novembre 2025"
    SELECT id INTO recette_kennedy_nov_id
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND description = 'Loyer Kennedy : Novembre 2025';
    
    RAISE NOTICE 'Recette Kennedy Novembre ID: %', recette_kennedy_nov_id;
    
    -- Supprimer toutes les liaisons de cette recette
    UPDATE depenses 
    SET recette_id = NULL
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND recette_id = recette_kennedy_nov_id;
    
    -- Lier uniquement "Namory" à cette recette
    UPDATE depenses 
    SET recette_id = recette_kennedy_nov_id
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND libelle = 'Namory'
    AND montant = 30000.00;
    
    RAISE NOTICE 'Correction terminée: Seule "Namory" est liée à "Loyer Kennedy : Novembre 2025"';
END $$;

-- Vérifier la correction
SELECT 
    'VÉRIFICATION KENNEDY NOVEMBRE' as info,
    r.description,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depense_attendue,
    COUNT(d.id) as nombre_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    CASE 
        WHEN COUNT(d.id) = 0 THEN '❌ SANS DÉPENSES'
        WHEN ABS(COALESCE(SUM(d.montant), 0) - (r.amount - r.solde_disponible)) < 0.01 THEN '✅ CORRESPONDANCE EXACTE'
        ELSE '⚠️ CORRESPONDANCE APPROCHÉE'
    END as qualite_liaison
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND r.description = 'Loyer Kennedy : Novembre 2025'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;


