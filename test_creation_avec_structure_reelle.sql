-- 🧪 TEST CRÉATION AVEC STRUCTURE RÉELLE
-- Script pour tester la création de recettes avec votre structure actuelle

-- 1. VÉRIFIER L'UTILISATEUR CONNECTÉ
SELECT 
    'UTILISATEUR CONNECTÉ' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. TESTER UNE INSERTION AVEC VOTRE STRUCTURE RÉELLE
DO $$
DECLARE
    test_user_id UUID;
    test_description TEXT := 'TEST APPLICATION - ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
    test_amount DECIMAL := 50000.00;
    test_receipt_date DATE := CURRENT_DATE;
    test_solde_disponible DECIMAL := 50000.00;
BEGIN
    -- Récupérer l'ID utilisateur
    test_user_id := auth.uid();
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ ERREUR: Aucun utilisateur connecté';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Utilisateur connecté: %', test_user_id;
    RAISE NOTICE '📊 Données de test:';
    RAISE NOTICE '   - Description: %', test_description;
    RAISE NOTICE '   - Amount: %', test_amount;
    RAISE NOTICE '   - Receipt Date: %', test_receipt_date;
    RAISE NOTICE '   - Solde Disponible: %', test_solde_disponible;
    
    -- 3. TENTER L'INSERTION AVEC VOTRE STRUCTURE
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
        
        RAISE NOTICE '✅ SUCCÈS: Recette créée avec succès!';
        
        -- Supprimer immédiatement la recette de test
        DELETE FROM recettes 
        WHERE description = test_description 
        AND user_id = test_user_id;
        
        RAISE NOTICE '🧹 Nettoyage: Recette de test supprimée';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERREUR: %', SQLERRM;
            RAISE NOTICE '🔍 Code erreur: %', SQLSTATE;
    END;
END $$;

-- 4. VÉRIFIER QUE LA STRUCTURE EST CORRECTE
SELECT 
    'VÉRIFICATION STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes'
AND column_name IN ('user_id', 'description', 'amount', 'receipt_date', 'solde_disponible')
ORDER BY ordinal_position;


