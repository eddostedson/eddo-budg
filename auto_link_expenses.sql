-- Script de liaison automatique des dépenses aux recettes
-- Basé sur la correspondance des montants

DO $$
DECLARE
    recette_record RECORD;
    depense_record RECORD;
    montant_depense_attendu NUMERIC;
    tolerance NUMERIC := 0.01; -- Tolérance de 1 centime
BEGIN
    -- Parcourir toutes les recettes
    FOR recette_record IN 
        SELECT id, description, amount, solde_disponible
        FROM recettes 
        WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
        AND amount > solde_disponible -- Il y a des dépenses attendues
    LOOP
        -- Calculer le montant de dépense attendu
        montant_depense_attendu := recette_record.amount - recette_record.solde_disponible;
        
        RAISE NOTICE 'Recette: % - Montant: % - Solde: % - Dépense attendue: %', 
            recette_record.description, 
            recette_record.amount, 
            recette_record.solde_disponible, 
            montant_depense_attendu;
        
        -- Chercher les dépenses correspondantes
        FOR depense_record IN 
            SELECT id, libelle, montant
            FROM depenses 
            WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
            AND recette_id IS NULL
            AND ABS(montant - montant_depense_attendu) < tolerance
        LOOP
            -- Lier la dépense à la recette
            UPDATE depenses 
            SET recette_id = recette_record.id
            WHERE id = depense_record.id;
            
            RAISE NOTICE 'LIAISON: Dépense "%" (% F CFA) liée à recette "%"', 
                depense_record.libelle, 
                depense_record.montant, 
                recette_record.description;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Liaison automatique terminée!';
END $$;

-- Vérifier les résultats
SELECT 
    'VERIFICATION' as info,
    COUNT(*) as total_depenses_liees
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NOT NULL;


