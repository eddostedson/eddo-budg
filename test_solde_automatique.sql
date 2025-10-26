-- 🧪 TEST DE MISE À JOUR AUTOMATIQUE DU SOLDE DISPONIBLE
-- Ce script teste la mise à jour automatique du solde après création/suppression de dépenses

-- 1. Vérifier l'état actuel de la recette "Salaire Septembre 2025"
SELECT 
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as solde_actuel,
  amount - solde_disponible as total_depenses_calcule,
  created_at
FROM recettes 
WHERE description LIKE '%Salaire Septembre%'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Vérifier toutes les dépenses liées à cette recette
SELECT 
  d.id,
  d.libelle,
  d.montant,
  d.date,
  d.recette_id,
  r.description as recette_libelle
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.description LIKE '%Salaire Septembre%'
ORDER BY d.created_at DESC;

-- 3. Calculer le total des dépenses pour cette recette
SELECT 
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_actuel,
  COALESCE(SUM(d.montant), 0) as total_depenses_calcule,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_attendu
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.description LIKE '%Salaire Septembre%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;

-- 4. Forcer la mise à jour du solde disponible avec le calcul correct
UPDATE recettes 
SET solde_disponible = (
  SELECT r.amount - COALESCE(SUM(d.montant), 0)
  FROM recettes r
  LEFT JOIN depenses d ON r.id = d.recette_id
  WHERE r.id = recettes.id
  GROUP BY r.id, r.amount
)
WHERE description LIKE '%Salaire Septembre%';

-- 5. Vérifier le résultat après mise à jour
SELECT 
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as nouveau_solde,
  amount - solde_disponible as total_depenses_final
FROM recettes 
WHERE description LIKE '%Salaire Septembre%'
ORDER BY created_at DESC
LIMIT 1;

-- 6. Test de création d'une dépense de test (5 FCFA)
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
  (SELECT user_id FROM recettes WHERE description LIKE '%Salaire Septembre%' LIMIT 1),
  'Test dépense 5 FCFA',
  5,
  CURRENT_DATE,
  'Test automatique',
  (SELECT id FROM recettes WHERE description LIKE '%Salaire Septembre%' LIMIT 1),
  'Test',
  NOW(),
  NOW()
);

-- 7. Vérifier le solde après création de la dépense de test
SELECT 
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_apres_creation,
  COALESCE(SUM(d.montant), 0) as total_depenses_apres_creation
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.description LIKE '%Salaire Septembre%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;

-- 8. Supprimer la dépense de test
DELETE FROM depenses 
WHERE libelle = 'Test dépense 5 FCFA' 
AND recette_id = (SELECT id FROM recettes WHERE description LIKE '%Salaire Septembre%' LIMIT 1);

-- 9. Vérifier le solde après suppression de la dépense de test
SELECT 
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_apres_suppression,
  COALESCE(SUM(d.montant), 0) as total_depenses_apres_suppression
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.description LIKE '%Salaire Septembre%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;


