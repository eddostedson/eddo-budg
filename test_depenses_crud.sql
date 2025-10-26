-- 🧪 Test CRUD des Dépenses
-- Ce script teste toutes les fonctionnalités des dépenses

-- 1. Vérifier l'authentification
SELECT 
  'Authentification' as test,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Utilisateur connecté: ' || auth.uid()
    ELSE '❌ Aucun utilisateur connecté'
  END as result;

-- 2. Lister les dépenses existantes
SELECT 
  'Dépenses existantes' as test,
  COUNT(*) as count,
  string_agg(id::text, ', ') as ids
FROM depenses 
WHERE user_id = auth.uid();

-- 3. Créer une dépense de test
INSERT INTO depenses (
  user_id,
  libelle,
  montant,
  date,
  description,
  categorie,
  created_at,
  updated_at
) VALUES (
  auth.uid(),
  'Test Dépense - ' || extract(epoch from now()),
  15000,
  current_date,
  'Test de création de dépense',
  'Test',
  now(),
  now()
) RETURNING 
  'Dépense de test créée' as test,
  id,
  libelle,
  montant,
  date;

-- 4. Vérifier que la dépense de test existe
SELECT 
  'Vérification dépense test' as test,
  id,
  libelle,
  montant,
  date
FROM depenses 
WHERE user_id = auth.uid() 
  AND libelle LIKE 'Test Dépense%'
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Tester la modification de la dépense
DO $$
DECLARE
  test_depense_id INTEGER;
  update_result BOOLEAN := FALSE;
BEGIN
  -- Récupérer l'ID de la dépense de test
  SELECT id INTO test_depense_id
  FROM depenses 
  WHERE user_id = auth.uid() 
    AND libelle LIKE 'Test Dépense%'
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF test_depense_id IS NULL THEN
    RAISE NOTICE '❌ Aucune dépense de test trouvée';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔄 Tentative de modification de la dépense: %', test_depense_id;
  
  -- Modifier la dépense
  UPDATE depenses 
  SET 
    libelle = 'Test Dépense Modifiée - ' || extract(epoch from now()),
    montant = 20000,
    description = 'Dépense modifiée avec succès',
    updated_at = now()
  WHERE id = test_depense_id 
    AND user_id = auth.uid();
  
  -- Vérifier si la modification a réussi
  IF FOUND THEN
    update_result := TRUE;
    RAISE NOTICE '✅ Dépense modifiée avec succès: %', test_depense_id;
  ELSE
    RAISE NOTICE '❌ Échec de la modification de la dépense: %', test_depense_id;
  END IF;
  
  -- Afficher le résultat final
  RAISE NOTICE '📊 Résultat du test de modification: %', 
    CASE WHEN update_result THEN 'SUCCÈS' ELSE 'ÉCHEC' END;
    
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la modification: %', SQLERRM;
END $$;

-- 6. Vérifier la modification
SELECT 
  'Vérification modification' as test,
  id,
  libelle,
  montant,
  description
FROM depenses 
WHERE user_id = auth.uid() 
  AND libelle LIKE 'Test Dépense Modifiée%'
ORDER BY updated_at DESC 
LIMIT 1;

-- 7. Tester la suppression de la dépense
DO $$
DECLARE
  test_depense_id INTEGER;
  delete_result BOOLEAN := FALSE;
BEGIN
  -- Récupérer l'ID de la dépense de test
  SELECT id INTO test_depense_id
  FROM depenses 
  WHERE user_id = auth.uid() 
    AND (libelle LIKE 'Test Dépense%' OR libelle LIKE 'Test Dépense Modifiée%')
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF test_depense_id IS NULL THEN
    RAISE NOTICE '❌ Aucune dépense de test trouvée';
    RETURN;
  END IF;
  
  RAISE NOTICE '🔄 Tentative de suppression de la dépense: %', test_depense_id;
  
  -- Supprimer la dépense
  DELETE FROM depenses 
  WHERE id = test_depense_id 
    AND user_id = auth.uid();
  
  -- Vérifier si la suppression a réussi
  IF FOUND THEN
    delete_result := TRUE;
    RAISE NOTICE '✅ Dépense supprimée avec succès: %', test_depense_id;
  ELSE
    RAISE NOTICE '❌ Échec de la suppression de la dépense: %', test_depense_id;
  END IF;
  
  -- Afficher le résultat final
  RAISE NOTICE '📊 Résultat du test de suppression: %', 
    CASE WHEN delete_result THEN 'SUCCÈS' ELSE 'ÉCHEC' END;
    
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors de la suppression: %', SQLERRM;
END $$;

-- 8. Vérifier que la dépense a bien été supprimée
SELECT 
  'Vérification suppression' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Dépense supprimée avec succès'
    ELSE '❌ Dépense encore présente: ' || COUNT(*) || ' dépense(s) trouvée(s)'
  END as result
FROM depenses 
WHERE user_id = auth.uid() 
  AND (libelle LIKE 'Test Dépense%' OR libelle LIKE 'Test Dépense Modifiée%');

-- 9. Nettoyer les dépenses de test restantes (au cas où)
DELETE FROM depenses 
WHERE user_id = auth.uid() 
  AND (libelle LIKE 'Test Dépense%' OR libelle LIKE 'Test Dépense Modifiée%');

-- 10. Résumé final
SELECT 
  'Test CRUD des dépenses terminé' as test,
  'Vérifiez les messages ci-dessus pour les détails' as result;


