-- 🧪 TEST CRÉATION RECETTE - SIMULATION APPLICATION
-- Script pour tester la création de recettes comme le fait l'application

-- 1. VÉRIFIER L'UTILISATEUR CONNECTÉ
SELECT 
    'UTILISATEUR CONNECTÉ' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. PRÉPARER LES DONNÉES DE TEST
DO $$
DECLARE
    test_user_id UUID;
    test_libelle TEXT := 'TEST APPLICATION - ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
    test_montant DECIMAL := 50000.00;
    test_date DATE := CURRENT_DATE;
    test_statut TEXT := 'reçue';
    test_description TEXT := 'Test de création depuis l''application';
BEGIN
    -- Récupérer l'ID utilisateur
    test_user_id := auth.uid();
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ ERREUR: Aucun utilisateur connecté';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Utilisateur connecté: %', test_user_id;
    RAISE NOTICE '📊 Données de test:';
    RAISE NOTICE '   - Libellé: %', test_libelle;
    RAISE NOTICE '   - Montant: %', test_montant;
    RAISE NOTICE '   - Date: %', test_date;
    RAISE NOTICE '   - Statut: %', test_statut;
    
    -- 3. TENTER L'INSERTION
    BEGIN
        INSERT INTO recettes (
            user_id,
            libelle,
            montant,
            solde_disponible,
            description,
            date_reception,
            statut
        ) VALUES (
            test_user_id,
            test_libelle,
            test_montant,
            test_montant, -- Solde initial = montant
            test_description,
            test_date,
            test_statut
        );
        
        RAISE NOTICE '✅ SUCCÈS: Recette créée avec succès!';
        
        -- Supprimer immédiatement la recette de test
        DELETE FROM recettes 
        WHERE libelle = test_libelle 
        AND user_id = test_user_id;
        
        RAISE NOTICE '🧹 Nettoyage: Recette de test supprimée';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERREUR: %', SQLERRM;
            RAISE NOTICE '🔍 Code erreur: %', SQLSTATE;
    END;
END $$;

-- 4. VÉRIFIER LES CONTRAINTES DE LA TABLE
SELECT 
    'CONTRAINTES ACTIVES' as info,
    conname as nom_contrainte,
    contype as type_contrainte,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'recettes'::regclass;

-- 5. VÉRIFIER LES TRIGGERS ACTIFS
SELECT 
    'TRIGGERS ACTIFS' as info,
    tgname as nom_trigger,
    tgenabled as statut,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'recettes'::regclass 
AND NOT tgisinternal;


