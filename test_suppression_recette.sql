-- 🧪 Test de Suppression de Recette
-- Ce script teste la suppression d'une recette en base de données

-- 1. Vérifier l'authentification
SELECT 
  'Authentification' as test,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Utilisateur connecté: ' || auth.uid()
    ELSE '❌ Aucun utilisateur connecté'
  END as result;

-- 2. Lister les recettes existantes
SELECT 
  'Recettes existantes' as test,
  COUNT(*) as count,
  string_agg(id::text, ', ') as ids
FROM recettes 
WHERE user_id = auth.uid();

-- 3. Créer une recette de test pour la suppression
INSERT INTO recettes (
  user_id,
  description,
  amount,
  solde_disponible,
  receipt_date,
  created_at,
  updated_at
) VALUES (
  auth.uid(),
  'Test Suppression - ' || extract(epoch from now()),
  10000,
  10000,
  current_date,
  now(),
  now()
) RETURNING 
  'Recette de test créée' as test,
  id,
  description,
  amount,
  solde_disponible;

-- 4. Vérifier que la recette de test existe
SELECT 
  'Vérification recette test' as test,
  id,
  description,
  amount,
  solde_disponible
FROM recettes 
WHERE user_id = auth.uid() 
  AND description LIKE 'Test Suppression%'
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Tenter la suppression de la recette de test
DO $$
DECLARE
  test_recette_id UUID;
  delete_result BOOLEAN := FALSE;
  error_message TEXT;
BEGIN
  -- Récupérer l'ID de la recette de test
  SELECT id INTO test_recette_id
  FROM recettes 
  WHERE user_id = auth.uid() 
    AND description LIKE 'Test Suppression%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF test_recette_id IS NULL THEN
    RAISE NOTICE '❌ Aucune recette de test trouvée';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔄 Tentative de suppression de la recette: %', test_recette_id;
  
  -- Supprimer la recette
  DELETE FROM recettes 
  WHERE id = test_recette_id 
    AND user_id = auth.uid();
  
  -- Vérifier si la suppression a réussi
  IF FOUND THEN
    delete_result := TRUE;
    RAISE NOTICE '✅ Recette supprimée avec succès: %', test_recette_id;
  ELSE
    RAISE NOTICE '❌ Échec de la suppression de la recette: %', test_recette_id;
  END IF;
  
  -- Afficher le résultat final
  RAISE NOTICE '📊 Résultat du test de suppression: %', 
    CASE WHEN delete_result THEN 'SUCCÈS' ELSE 'ÉCHEC' END;
    
EXCEPTION
  WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE '❌ Erreur lors de la suppression: %', error_message;
END $$;

-- 6. Vérifier que la recette a bien été supprimée
SELECT 
  'Vérification suppression' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Recette supprimée avec succès'
    ELSE '❌ Recette encore présente: ' || COUNT(*) || ' recette(s) trouvée(s)'
  END as result
FROM recettes 
WHERE user_id = auth.uid() 
  AND description LIKE 'Test Suppression%';

-- 7. Nettoyer les recettes de test restantes (au cas où)
DELETE FROM recettes 
WHERE user_id = auth.uid() 
  AND description LIKE 'Test Suppression%';

-- 8. Résumé final
SELECT 
  'Test de suppression terminé' as test,
  'Vérifiez les messages ci-dessus pour les détails' as result;


