-- Version simplifiée de la liaison intelligente
-- Trouve des combinaisons de 1 ou 2 dépenses qui correspondent exactement

DO $$
DECLARE
    recette_record RECORD;
    depense_record RECORD;
    montant_depense_attendu NUMERIC;
    tolerance NUMERIC := 0.01;
    total_liees INTEGER := 0;
    combinaison_trouvee BOOLEAN;
BEGIN
    RAISE NOTICE 'Début de la liaison intelligente simplifiée...';
    
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
        
        combinaison_trouvee := FALSE;
        
        -- Essayer d'abord une correspondance exacte simple
        FOR depense_record IN 
            SELECT id, libelle, montant
            FROM depenses 
            WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
            AND recette_id IS NULL
            AND ABS(montant - montant_depense_attendu) < tolerance
            LIMIT 1
        LOOP
            UPDATE depenses 
            SET recette_id = recette_record.id
            WHERE id = depense_record.id;
            
            total_liees := total_liees + 1;
            combinaison_trouvee := TRUE;
            RAISE NOTICE 'LIAISON SIMPLE: Dépense "%" (% F CFA) → Recette "%"', 
                depense_record.libelle, 
                depense_record.montant, 
                recette_record.description;
        END LOOP;
        
        -- Si pas de correspondance simple, essayer des combinaisons de 2 dépenses
        IF NOT combinaison_trouvee THEN
            FOR depense_record IN 
                SELECT 
                    d1.id as id1, d1.libelle as libelle1, d1.montant as montant1,
                    d2.id as id2, d2.libelle as libelle2, d2.montant as montant2
                FROM depenses d1
                CROSS JOIN depenses d2
                WHERE d1.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
                AND d2.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
                AND d1.recette_id IS NULL
                AND d2.recette_id IS NULL
                AND d1.id < d2.id -- Éviter les doublons
                AND ABS((d1.montant + d2.montant) - montant_depense_attendu) < tolerance
                LIMIT 1
            LOOP
                UPDATE depenses 
                SET recette_id = recette_record.id
                WHERE id IN (depense_record.id1, depense_record.id2);
                
                total_liees := total_liees + 2;
                combinaison_trouvee := TRUE;
                RAISE NOTICE 'LIAISON DOUBLE: "%" (% F CFA) + "%" (% F CFA) = % F CFA → Recette "%"', 
                    depense_record.libelle1, 
                    depense_record.montant1,
                    depense_record.libelle2, 
                    depense_record.montant2,
                    depense_record.montant1 + depense_record.montant2,
                    recette_record.description;
            END LOOP;
        END IF;
        
        IF NOT combinaison_trouvee THEN
            RAISE NOTICE 'Aucune combinaison trouvée pour: %', recette_record.description;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Liaison intelligente terminée: % dépenses liées', total_liees;
END $$;

-- Vérifier les résultats
SELECT 
    'RÉSULTATS FINAUX' as info,
    COUNT(*) as total_depenses_liees,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' AND recette_id IS NULL) as depenses_non_liees
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NOT NULL;


