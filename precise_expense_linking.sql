-- Script de liaison précise des dépenses aux recettes
-- Liaison uniquement des dépenses qui correspondent exactement aux montants attendus

DO $$
DECLARE
    recette_record RECORD;
    depense_record RECORD;
    montant_depense_attendu NUMERIC;
    tolerance NUMERIC := 0.01; -- Tolérance très stricte
    total_liees INTEGER := 0;
BEGIN
    RAISE NOTICE 'Début de la liaison précise...';
    
    -- Parcourir toutes les recettes qui ont des dépenses attendues
    FOR recette_record IN 
        SELECT id, description, amount, solde_disponible
        FROM recettes 
        WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
        AND amount > solde_disponible
        ORDER BY amount DESC
    LOOP
        montant_depense_attendu := recette_record.amount - recette_record.solde_disponible;
        
        RAISE NOTICE 'Recette: % - Montant: % - Solde: % - Dépense attendue: %', 
            recette_record.description, 
            recette_record.amount, 
            recette_record.solde_disponible, 
            montant_depense_attendu;
        
        -- Chercher les dépenses qui correspondent exactement
        FOR depense_record IN 
            SELECT id, libelle, montant
            FROM depenses 
            WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
            AND recette_id IS NULL
            AND ABS(montant - montant_depense_attendu) < tolerance
        LOOP
            UPDATE depenses 
            SET recette_id = recette_record.id
            WHERE id = depense_record.id;
            
            total_liees := total_liees + 1;
            RAISE NOTICE 'LIAISON PRÉCISE: Dépense "%" (% F CFA) → Recette "%"', 
                depense_record.libelle, 
                depense_record.montant, 
                recette_record.description;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Liaison précise terminée: % dépenses liées', total_liees;
END $$;

-- Vérifier les résultats finaux
SELECT 
    'RÉSULTATS FINAUX' as info,
    COUNT(*) as total_depenses_liees,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' AND recette_id IS NULL) as depenses_non_liees
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NOT NULL;


