-- 🧪 TEST CRÉATION AVEC RÉSULTATS VISIBLES
-- Script modifié pour afficher les résultats dans l'onglet Results

-- 1. VÉRIFIER L'UTILISATEUR CONNECTÉ
SELECT 
    'UTILISATEUR CONNECTÉ' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. TESTER UNE INSERTION ET AFFICHER LES RÉSULTATS
DO $$
DECLARE
    test_user_id UUID;
    test_description TEXT := 'TEST APPLICATION - ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
    test_amount DECIMAL := 50000.00;
    test_receipt_date DATE := CURRENT_DATE;
    test_solde_disponible DECIMAL := 50000.00;
    result_message TEXT;
BEGIN
    -- Récupérer l'ID utilisateur
    test_user_id := auth.uid();
    
    IF test_user_id IS NULL THEN
        result_message := '❌ ERREUR: Aucun utilisateur connecté';
        RAISE NOTICE '%', result_message;
        RETURN;
    END IF;
    
    result_message := '✅ Utilisateur connecté: ' || test_user_id;
    RAISE NOTICE '%', result_message;
    
    result_message := '📊 Données de test:';
    RAISE NOTICE '%', result_message;
    result_message := '   - Description: ' || test_description;
    RAISE NOTICE '%', result_message;
    result_message := '   - Amount: ' || test_amount;
    RAISE NOTICE '%', result_message;
    result_message := '   - Receipt Date: ' || test_receipt_date;
    RAISE NOTICE '%', result_message;
    result_message := '   - Solde Disponible: ' || test_solde_disponible;
    RAISE NOTICE '%', result_message;
    
    -- 3. TENTER L'INSERTION
    BEGIN
        INSERT INTO recettes (
            user_id,
            description,
            amount,
            receipt_date,
            solde_disponible
        ) VALUES (
            test_user_id,
            test_description,
            test_amount,
            test_receipt_date,
            test_solde_disponible
        );
        
        result_message := '✅ SUCCÈS: Recette créée avec succès!';
        RAISE NOTICE '%', result_message;
        
        -- Supprimer immédiatement la recette de test
        DELETE FROM recettes 
        WHERE description = test_description 
        AND user_id = test_user_id;
        
        result_message := '🧹 Nettoyage: Recette de test supprimée';
        RAISE NOTICE '%', result_message;
        
    EXCEPTION
        WHEN OTHERS THEN
            result_message := '❌ ERREUR: ' || SQLERRM;
            RAISE NOTICE '%', result_message;
            result_message := '🔍 Code erreur: ' || SQLSTATE;
            RAISE NOTICE '%', result_message;
    END;
END $$;

-- 3. AFFICHER UN RÉSUMÉ DU TEST
SELECT 
    'RÉSUMÉ DU TEST' as info,
    'Test d''insertion terminé' as message,
    'Vérifiez la console pour les détails' as details;





