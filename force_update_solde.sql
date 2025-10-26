-- 🔧 MISE À JOUR FORCÉE DU SOLDE DISPONIBLE
-- Ce script force la mise à jour du solde disponible pour toutes les recettes

-- 1. Créer une fonction pour recalculer le solde disponible
CREATE OR REPLACE FUNCTION recalculer_solde_disponible()
RETURNS TABLE(
  recette_id UUID,
  libelle TEXT,
  montant_initial NUMERIC,
  solde_ancien NUMERIC,
  total_depenses NUMERIC,
  solde_nouveau NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.description,
    r.amount,
    r.solde_disponible,
    COALESCE(SUM(d.montant), 0),
    r.amount - COALESCE(SUM(d.montant), 0)
  FROM recettes r
  LEFT JOIN depenses d ON r.id = d.recette_id
  GROUP BY r.id, r.description, r.amount, r.solde_disponible;
END;
$$ LANGUAGE plpgsql;

-- 2. Exécuter la fonction pour voir les calculs
SELECT * FROM recalculer_solde_disponible();

-- 3. Mettre à jour le solde disponible pour toutes les recettes
UPDATE recettes 
SET solde_disponible = (
  SELECT r.amount - COALESCE(SUM(d.montant), 0)
  FROM recettes r
  LEFT JOIN depenses d ON r.id = d.recette_id
  WHERE r.id = recettes.id
  GROUP BY r.id, r.amount
);

-- 4. Vérifier le résultat après mise à jour
SELECT 
  'APRÈS MISE À JOUR' as section,
  id,
  description,
  amount,
  solde_disponible,
  amount - solde_disponible as total_depenses_calcule
FROM recettes 
ORDER BY created_at DESC;

-- 5. Vérifier qu'il n'y a plus d'écarts
SELECT 
  'VÉRIFICATION FINALE' as section,
  COUNT(*) as total_recettes,
  COUNT(CASE WHEN ABS(solde_disponible - (amount - COALESCE((
    SELECT SUM(montant) 
    FROM depenses 
    WHERE recette_id = recettes.id
  ), 0))) > 0.01 THEN 1 END) as recettes_avec_ecarts
FROM recettes;

-- 6. Afficher les recettes qui ont encore des écarts (s'il y en a)
SELECT 
  'ÉCARTS RESTANTS' as section,
  r.id,
  r.description,
  r.amount,
  r.solde_disponible,
  COALESCE(SUM(d.montant), 0) as total_depenses,
  r.amount - COALESCE(SUM(d.montant), 0) as solde_correct,
  ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) as ecart
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
HAVING ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) > 0.01
ORDER BY ecart DESC;


