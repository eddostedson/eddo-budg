-- 🧪 TEST SIMPLE DE MISE À JOUR DU SOLDE
-- Ce script teste la mise à jour du solde de manière simple

-- 1. Vérifier l'état actuel d'une recette spécifique
SELECT 
  'RECETTE AVANT TEST' as section,
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as solde_actuel,
  amount - solde_disponible as total_depenses_calcule
FROM recettes 
WHERE description LIKE '%Salaire Septembre%'
ORDER BY created_at DESC
LIMIT 1;

-- 2. Vérifier les dépenses liées à cette recette
SELECT 
  'DÉPENSES LIÉES' as section,
  d.id,
  d.libelle,
  d.montant,
  d.date,
  d.recette_id
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.description LIKE '%Salaire Septembre%'
ORDER BY d.created_at DESC;

-- 3. Calculer le solde théorique
SELECT 
  'CALCUL THÉORIQUE' as section,
  r.id as recette_id,
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_actuel,
  COALESCE(SUM(d.montant), 0) as total_depenses,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_theorique,
  r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0)) as ecart
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.description LIKE '%Salaire Septembre%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;

-- 4. Mettre à jour le solde avec le calcul correct
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
  'RÉSULTAT APRÈS MISE À JOUR' as section,
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as nouveau_solde,
  amount - solde_disponible as total_depenses_final
FROM recettes 
WHERE description LIKE '%Salaire Septembre%'
ORDER BY created_at DESC
LIMIT 1;

-- 6. Vérifier qu'il n'y a plus d'écart
SELECT 
  'VÉRIFICATION FINALE' as section,
  r.id,
  r.description,
  r.amount,
  r.solde_disponible,
  COALESCE(SUM(d.montant), 0) as total_depenses,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_theorique,
  ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) as ecart_absolu
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.description LIKE '%Salaire Septembre%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;





