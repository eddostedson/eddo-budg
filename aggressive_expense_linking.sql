-- Script de liaison agressive des dépenses aux recettes
-- Version plus permissive pour lier plus de dépenses

DO $$
DECLARE
    recette_record RECORD;
    depense_record RECORD;
    montant_depense_attendu NUMERIC;
    tolerance NUMERIC := 1000; -- Tolérance de 1000 F CFA
    total_liees INTEGER := 0;
    total_recettes INTEGER := 0;
    total_depenses INTEGER := 0;
BEGIN
    -- Compter les recettes et dépenses
    SELECT COUNT(*) INTO total_recettes 
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';
    
    SELECT COUNT(*) INTO total_depenses 
    FROM depenses 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';
    
    RAISE NOTICE 'Début de la liaison agressive: % recettes, % dépenses', total_recettes, total_depenses;
    
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
        
        -- Chercher les dépenses correspondantes (correspondance exacte d'abord)
        FOR depense_record IN 
            SELECT id, libelle, montant
            FROM depenses 
            WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
            AND recette_id IS NULL
            AND ABS(montant - montant_depense_attendu) < 0.01
        LOOP
            UPDATE depenses 
            SET recette_id = recette_record.id
            WHERE id = depense_record.id;
            
            total_liees := total_liees + 1;
            RAISE NOTICE 'LIAISON EXACTE: Dépense "%" (% F CFA) → Recette "%"', 
                depense_record.libelle, 
                depense_record.montant, 
                recette_record.description;
        END LOOP;
        
        -- Si pas de correspondance exacte, chercher la dépense la plus proche
        IF NOT FOUND THEN
            FOR depense_record IN 
                SELECT id, libelle, montant
                FROM depenses 
                WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
                AND recette_id IS NULL
                AND montant <= montant_depense_attendu
                AND ABS(montant - montant_depense_attendu) < tolerance
                ORDER BY ABS(montant - montant_depense_attendu) ASC
                LIMIT 1
            LOOP
                UPDATE depenses 
                SET recette_id = recette_record.id
                WHERE id = depense_record.id;
                
                total_liees := total_liees + 1;
                RAISE NOTICE 'LIAISON APPROCHEE: Dépense "%" (% F CFA) → Recette "%" (différence: % F CFA)', 
                    depense_record.libelle, 
                    depense_record.montant, 
                    recette_record.description,
                    ABS(depense_record.montant - montant_depense_attendu);
            END LOOP;
        END IF;
        
        -- Si toujours pas de correspondance, lier la plus grosse dépense disponible
        IF NOT FOUND THEN
            FOR depense_record IN 
                SELECT id, libelle, montant
                FROM depenses 
                WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
                AND recette_id IS NULL
                AND montant <= montant_depense_attendu
                ORDER BY montant DESC
                LIMIT 1
            LOOP
                UPDATE depenses 
                SET recette_id = recette_record.id
                WHERE id = depense_record.id;
                
                total_liees := total_liees + 1;
                RAISE NOTICE 'LIAISON FORCEE: Dépense "%" (% F CFA) → Recette "%" (différence: % F CFA)', 
                    depense_record.libelle, 
                    depense_record.montant, 
                    recette_record.description,
                    ABS(depense_record.montant - montant_depense_attendu);
            END LOOP;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Liaison agressive terminée: % dépenses liées sur %', total_liees, total_depenses;
END $$;

-- Vérifier les résultats finaux
SELECT 
    'RÉSULTATS FINAUX' as info,
    COUNT(*) as total_depenses_liees,
    (SELECT COUNT(*) FROM depenses WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' AND recette_id IS NULL) as depenses_non_liees
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NOT NULL;


