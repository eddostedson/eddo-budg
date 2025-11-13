-- Script pour corriger les liaisons incorrectes des dépenses
-- Supprimer les liaisons qui ne correspondent pas aux montants attendus

DO $$
DECLARE
    recette_record RECORD;
    depense_record RECORD;
    montant_depense_attendu NUMERIC;
    tolerance NUMERIC := 100; -- Tolérance de 100 F CFA
    total_supprimees INTEGER := 0;
BEGIN
    RAISE NOTICE 'Début du nettoyage des liaisons incorrectes...';
    
    -- Parcourir toutes les recettes
    FOR recette_record IN 
        SELECT id, description, amount, solde_disponible
        FROM recettes 
        WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
        ORDER BY amount DESC
    LOOP
        montant_depense_attendu := recette_record.amount - recette_record.solde_disponible;
        
        RAISE NOTICE 'Recette: % - Montant: % - Solde: % - Dépense attendue: %', 
            recette_record.description, 
            recette_record.amount, 
            recette_record.solde_disponible, 
            montant_depense_attendu;
        
        -- Si pas de dépense attendue, supprimer toutes les liaisons
        IF montant_depense_attendu <= 0 THEN
            UPDATE depenses 
            SET recette_id = NULL
            WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
            AND recette_id = recette_record.id;
            
            RAISE NOTICE 'Suppression de toutes les liaisons pour: % (pas de dépense attendue)', recette_record.description;
        ELSE
            -- Supprimer les liaisons qui ne correspondent pas au montant attendu
            FOR depense_record IN 
                SELECT id, libelle, montant
                FROM depenses 
                WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
                AND recette_id = recette_record.id
                AND ABS(montant - montant_depense_attendu) > tolerance
            LOOP
                UPDATE depenses 
                SET recette_id = NULL
                WHERE id = depense_record.id;
                
                total_supprimees := total_supprimees + 1;
                RAISE NOTICE 'SUPPRESSION: Dépense "%" (% F CFA) déliée de recette "%" (différence: % F CFA)', 
                    depense_record.libelle, 
                    depense_record.montant, 
                    recette_record.description,
                    ABS(depense_record.montant - montant_depense_attendu);
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Nettoyage terminé: % liaisons incorrectes supprimées', total_supprimees;
END $$;

-- Vérifier les résultats après nettoyage
SELECT 
    'RÉSULTATS APRÈS NETTOYAGE' as info,
    COUNT(*) as total_depenses_liees,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' AND recette_id IS NULL) as depenses_non_liees
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NOT NULL;


