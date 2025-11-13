-- Script de liaison intelligente des dépenses aux recettes
-- Basé sur la logique : Montant Recette - Solde Disponible = Total Dépenses Attendues
-- Trouve des combinaisons de dépenses non liées qui correspondent

DO $$
DECLARE
    recette_record RECORD;
    depense_record RECORD;
    montant_depense_attendu NUMERIC;
    tolerance NUMERIC := 0.01; -- Tolérance de 1 centime
    total_liees INTEGER := 0;
    combinaison_trouvee BOOLEAN;
    depenses_candidates RECORD[];
    depenses_candidates_count INTEGER;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    l INTEGER;
    somme_temp NUMERIC;
    depenses_selectionnees INTEGER[];
BEGIN
    RAISE NOTICE 'Début de la liaison intelligente...';
    
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
        
        -- Récupérer toutes les dépenses non liées
        SELECT ARRAY_AGG(
            ROW(id, libelle, montant)::RECORD
        ) INTO depenses_candidates
        FROM depenses 
        WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
        AND recette_id IS NULL
        ORDER BY montant DESC;
        
        depenses_candidates_count := array_length(depenses_candidates, 1);
        
        IF depenses_candidates_count IS NULL OR depenses_candidates_count = 0 THEN
            RAISE NOTICE 'Aucune dépense non liée disponible pour: %', recette_record.description;
            CONTINUE;
        END IF;
        
        combinaison_trouvee := FALSE;
        
        -- Essayer des combinaisons de 1 à 4 dépenses
        FOR i IN 1..LEAST(4, depenses_candidates_count) LOOP
            -- Combinaisons de i dépenses
            FOR j IN 1..depenses_candidates_count LOOP
                IF i = 1 THEN
                    -- 1 dépense
                    IF ABS((depenses_candidates[j]::RECORD).montant - montant_depense_attendu) < tolerance THEN
                        UPDATE depenses 
                        SET recette_id = recette_record.id
                        WHERE id = (depenses_candidates[j]::RECORD).id;
                        
                        total_liees := total_liees + 1;
                        combinaison_trouvee := TRUE;
                        RAISE NOTICE 'LIAISON SIMPLE: Dépense "%" (% F CFA) → Recette "%"', 
                            (depenses_candidates[j]::RECORD).libelle, 
                            (depenses_candidates[j]::RECORD).montant, 
                            recette_record.description;
                        EXIT;
                    END IF;
                ELSIF i = 2 THEN
                    -- 2 dépenses
                    FOR k IN (j+1)..depenses_candidates_count LOOP
                        somme_temp := (depenses_candidates[j]::RECORD).montant + (depenses_candidates[k]::RECORD).montant;
                        IF ABS(somme_temp - montant_depense_attendu) < tolerance THEN
                            UPDATE depenses 
                            SET recette_id = recette_record.id
                            WHERE id IN ((depenses_candidates[j]::RECORD).id, (depenses_candidates[k]::RECORD).id);
                            
                            total_liees := total_liees + 2;
                            combinaison_trouvee := TRUE;
                            RAISE NOTICE 'LIAISON DOUBLE: Dépenses "%" (% F CFA) + "%" (% F CFA) = % F CFA → Recette "%"', 
                                (depenses_candidates[j]::RECORD).libelle, 
                                (depenses_candidates[j]::RECORD).montant,
                                (depenses_candidates[k]::RECORD).libelle, 
                                (depenses_candidates[k]::RECORD).montant,
                                somme_temp,
                                recette_record.description;
                            EXIT;
                        END IF;
                    END LOOP;
                    IF combinaison_trouvee THEN EXIT; END IF;
                ELSIF i = 3 THEN
                    -- 3 dépenses
                    FOR k IN (j+1)..depenses_candidates_count LOOP
                        FOR l IN (k+1)..depenses_candidates_count LOOP
                            somme_temp := (depenses_candidates[j]::RECORD).montant + 
                                        (depenses_candidates[k]::RECORD).montant + 
                                        (depenses_candidates[l]::RECORD).montant;
                            IF ABS(somme_temp - montant_depense_attendu) < tolerance THEN
                                UPDATE depenses 
                                SET recette_id = recette_record.id
                                WHERE id IN ((depenses_candidates[j]::RECORD).id, 
                                            (depenses_candidates[k]::RECORD).id, 
                                            (depenses_candidates[l]::RECORD).id);
                                
                                total_liees := total_liees + 3;
                                combinaison_trouvee := TRUE;
                                RAISE NOTICE 'LIAISON TRIPLE: 3 dépenses = % F CFA → Recette "%"', 
                                    somme_temp,
                                    recette_record.description;
                                EXIT;
                            END IF;
                        END LOOP;
                        IF combinaison_trouvee THEN EXIT; END IF;
                    END LOOP;
                    IF combinaison_trouvee THEN EXIT; END IF;
                END IF;
            END LOOP;
            IF combinaison_trouvee THEN EXIT; END IF;
        END LOOP;
        
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


