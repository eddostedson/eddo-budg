-- Test de connexion simple
-- Exécutez ce script pour vérifier la connexion

-- 1. Test simple - compter les recettes
SELECT 
    'TEST_CONNEXION' as info,
    COUNT(*) as nombre_recettes
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';

-- 2. Test simple - compter les dépenses
SELECT 
    'TEST_CONNEXION' as info,
    COUNT(*) as nombre_depenses
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';


