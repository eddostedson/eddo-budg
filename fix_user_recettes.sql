-- 🔧 CORRECTIF: Réassigner toutes les recettes à l'utilisateur connecté
-- Ce script corrige le problème d'affichage en réassignant les recettes

-- ========================================
-- ÉTAPE 1: IDENTIFIER LES UTILISATEURS
-- ========================================

-- Lister tous les utilisateurs
SELECT 
    'UTILISATEURS DISPONIBLES' as info,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at;

-- ========================================
-- ÉTAPE 2: VÉRIFIER LA SITUATION ACTUELLE
-- ========================================

-- Voir la distribution des recettes par utilisateur
SELECT 
    'SITUATION ACTUELLE' as info,
    r.user_id,
    u.email,
    COUNT(*) as nombre_recettes
FROM recettes r
LEFT JOIN auth.users u ON r.user_id = u.id
GROUP BY r.user_id, u.email;

-- ========================================
-- ÉTAPE 3: DÉSACTIVER TEMPORAIREMENT RLS (SI NÉCESSAIRE)
-- ========================================

-- Désactiver RLS temporairement pour permettre la réassignation
ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;

-- ========================================
-- ÉTAPE 4: RÉASSIGNER TOUTES LES RECETTES À UN SEUL UTILISATEUR
-- ========================================

-- OPTION A: Réassigner toutes les recettes à l'utilisateur 'eddostedson@gmail.com'
-- Décommentez et modifiez l'ID selon votre besoin

-- Récupérer l'ID de l'utilisateur cible (eddostedson@gmail.com)
DO $$
DECLARE
    target_user_id UUID;
    recettes_updated INTEGER;
BEGIN
    -- Trouver l'utilisateur eddostedson@gmail.com
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'eddostedson@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur eddostedson@gmail.com non trouvé';
    END IF;
    
    RAISE NOTICE 'User ID trouvé: %', target_user_id;
    
    -- Réassigner TOUTES les recettes à cet utilisateur
    UPDATE recettes 
    SET user_id = target_user_id;
    
    GET DIAGNOSTICS recettes_updated = ROW_COUNT;
    
    RAISE NOTICE '✅ % recettes réassignées à eddostedson@gmail.com', recettes_updated;
    
    -- Réassigner TOUTES les dépenses à cet utilisateur
    UPDATE depenses 
    SET user_id = target_user_id;
    
    GET DIAGNOSTICS recettes_updated = ROW_COUNT;
    
    RAISE NOTICE '✅ % dépenses réassignées à eddostedson@gmail.com', recettes_updated;
END $$;

-- ========================================
-- ÉTAPE 5: RÉACTIVER RLS
-- ========================================

ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ÉTAPE 6: VÉRIFIER LE RÉSULTAT
-- ========================================

-- Vérifier la nouvelle distribution
SELECT 
    'SITUATION APRÈS CORRECTION' as info,
    r.user_id,
    u.email,
    COUNT(*) as nombre_recettes,
    SUM(r.amount) as total_montant,
    SUM(r.solde_disponible) as total_solde_disponible
FROM recettes r
LEFT JOIN auth.users u ON r.user_id = u.id
GROUP BY r.user_id, u.email;

-- ========================================
-- ÉTAPE 7: TEST AVEC L'UTILISATEUR CONNECTÉ
-- ========================================

-- Cette requête simule ce que l'application voit
-- Elle devrait maintenant retourner les recettes si vous êtes connecté avec eddostedson@gmail.com
SELECT 
    'TEST: RECETTES VISIBLES DEPUIS L\'APP' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_montant
FROM recettes
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'eddostedson@gmail.com');

-- ========================================
-- NOTES IMPORTANTES
-- ========================================

-- 1. Ce script réassigne TOUTES les recettes à eddostedson@gmail.com
-- 2. Si vous voulez réassigner à un autre utilisateur, modifiez l'email dans le script
-- 3. Si vous avez plusieurs utilisateurs légitimes, NE PAS utiliser ce script
-- 4. Pour cibler un utilisateur spécifique, utilisez son ID directement :
--    UPDATE recettes SET user_id = 'UUID_DU_BON_UTILISATEUR' WHERE user_id = 'UUID_DE_LANCIEN_UTILISATEUR';



