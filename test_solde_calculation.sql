-- 🧪 TEST DE CALCUL DU SOLDE DISPONIBLE
-- Ce script teste le calcul du solde disponible après création de dépense

-- 1. Vérifier la recette "Salaire Septembre 2025"
SELECT 
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as solde_actuel,
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
  COALESCE(SUM(d.montant), 0) as total_depenses,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_calcule
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.description LIKE '%Salaire Septembre%'
GROUP BY r.id, r.description, r.amount, r.solde_disponible;

-- 4. Mettre à jour le solde disponible avec le calcul correct
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
  amount - solde_disponible as total_depenses_calcule
FROM recettes 
WHERE description LIKE '%Salaire Septembre%'
ORDER BY created_at DESC
LIMIT 1;





