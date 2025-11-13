-- 🔍 DIAGNOSTIC COMPLET DU PROBLÈME DE SOLDE
-- Ce script diagnostique en profondeur le problème de mise à jour du solde

-- 1. Vérifier l'état actuel de toutes les recettes
SELECT 
  'RECETTES ACTUELLES' as section,
  id,
  description as libelle,
  amount as montant_initial,
  solde_disponible as solde_actuel,
  amount - solde_disponible as difference,
  created_at
FROM recettes 
ORDER BY created_at DESC;

-- 2. Vérifier toutes les dépenses avec leurs recettes associées
SELECT 
  'DÉPENSES AVEC RECETTES' as section,
  d.id as depense_id,
  d.libelle as depense_libelle,
  d.montant as montant_depense,
  d.date as date_depense,
  r.description as recette_libelle,
  r.amount as montant_recette,
  r.solde_disponible as solde_recette
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
ORDER BY d.created_at DESC;

-- 3. Calculer le solde théorique pour chaque recette
SELECT 
  'SOLDE THÉORIQUE' as section,
  r.id as recette_id,
  r.description as recette_libelle,
  r.amount as montant_initial,
  r.solde_disponible as solde_actuel,
  COALESCE(SUM(d.montant), 0) as total_depenses,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_theorique,
  r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0)) as ecart
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY ecart DESC;

-- 4. Identifier les recettes avec des écarts
SELECT 
  'RECETTES AVEC ÉCARTS' as section,
  r.id,
  r.description,
  r.amount,
  r.solde_disponible,
  COALESCE(SUM(d.montant), 0) as total_depenses,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_correct,
  ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) as ecart_absolu
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
HAVING ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) > 0.01
ORDER BY ecart_absolu DESC;

-- 5. Vérifier les triggers existants
SELECT 
  'TRIGGERS EXISTANTS' as section,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('recettes', 'depenses')
ORDER BY trigger_name;

-- 6. Vérifier les contraintes de la table recettes
SELECT 
  'CONTRAINTES RECETTES' as section,
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'recettes';

-- 7. Vérifier la structure de la table recettes
SELECT 
  'STRUCTURE RECETTES' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;





