-- 🧪 TEST DE SUPPRESSION DE DÉPENSE
-- Ce script teste la suppression d'une dépense et la mise à jour du solde

-- 1. Vérifier l'état actuel des dépenses
SELECT 
  'DÉPENSES ACTUELLES' as section,
  d.id,
  d.libelle,
  d.montant,
  d.date,
  d.recette_id,
  r.description as recette_libelle
FROM depenses d
LEFT JOIN recettes r ON d.recette_id = r.id
ORDER BY d.created_at DESC
LIMIT 10;

-- 2. Vérifier l'état actuel des recettes
SELECT 
  'RECETTES ACTUELLES' as section,
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as solde_actuel,
  amount - solde_disponible as total_depenses_calcule
FROM recettes 
ORDER BY created_at DESC
LIMIT 5;

-- 3. Créer une dépense de test pour tester la suppression
INSERT INTO depenses (
  user_id,
  libelle,
  montant,
  date,
  description,
  recette_id,
  categorie,
  created_at,
  updated_at
) VALUES (
  (SELECT user_id FROM recettes LIMIT 1),
  'Test suppression dépense',
  100,
  CURRENT_DATE,
  'Test de suppression',
  (SELECT id FROM recettes LIMIT 1),
  'Test',
  NOW(),
  NOW()
);

-- 4. Vérifier que la dépense de test a été créée
SELECT 
  'DÉPENSE DE TEST CRÉÉE' as section,
  d.id,
  d.libelle,
  d.montant,
  d.recette_id,
  r.description as recette_libelle,
  r.solde_disponible as solde_avant_suppression
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE d.libelle = 'Test suppression dépense';

-- 5. Supprimer la dépense de test
DELETE FROM depenses 
WHERE libelle = 'Test suppression dépense';

-- 6. Vérifier que la dépense a été supprimée
SELECT 
  'VÉRIFICATION SUPPRESSION' as section,
  COUNT(*) as nombre_depenses_test
FROM depenses 
WHERE libelle = 'Test suppression dépense';

-- 7. Vérifier le solde de la recette après suppression
SELECT 
  'SOLDE APRÈS SUPPRESSION' as section,
  r.id,
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_actuel,
  COALESCE(SUM(d.montant), 0) as total_depenses_restantes,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_theorique
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.id = (SELECT id FROM recettes LIMIT 1)
GROUP BY r.id, r.description, r.amount, r.solde_disponible;

-- 8. Mettre à jour le solde disponible de la recette
UPDATE recettes 
SET solde_disponible = (
  SELECT r.amount - COALESCE(SUM(d.montant), 0)
  FROM recettes r
  LEFT JOIN depenses d ON r.id = d.recette_id
  WHERE r.id = recettes.id
  GROUP BY r.id, r.amount
)
WHERE id = (SELECT id FROM recettes LIMIT 1);

-- 9. Vérifier le résultat final
SELECT 
  'RÉSULTAT FINAL' as section,
  r.id,
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_final,
  COALESCE(SUM(d.montant), 0) as total_depenses_final,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_theorique_final
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.id = (SELECT id FROM recettes LIMIT 1)
GROUP BY r.id, r.description, r.amount, r.solde_disponible;


