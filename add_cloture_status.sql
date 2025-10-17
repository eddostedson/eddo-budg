-- Migration pour ajouter le statut de clôture aux recettes
-- Ajoute une colonne 'statut' pour distinguer les recettes actives des clôturées

-- 1. Ajouter la colonne statut à la table recettes
ALTER TABLE recettes 
ADD COLUMN statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'cloturee'));

-- 2. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_recettes_statut ON recettes(statut);

-- 3. Créer une fonction pour clôturer automatiquement les recettes avec solde = 0
CREATE OR REPLACE FUNCTION cloturer_recettes_automatiquement()
RETURNS TRIGGER AS $$
BEGIN
  -- Après chaque modification de dépense, vérifier les recettes à clôturer
  UPDATE recettes 
  SET statut = 'cloturee',
      updated_at = NOW()
  WHERE statut = 'active' 
    AND id IN (
      SELECT r.id 
      FROM recettes r
      LEFT JOIN depenses d ON d.recette_id = r.id
      GROUP BY r.id, r.montant
      HAVING r.montant - COALESCE(SUM(d.montant), 0) <= 0
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour la clôture automatique
DROP TRIGGER IF EXISTS trigger_cloture_automatique ON depenses;
CREATE TRIGGER trigger_cloture_automatique
  AFTER INSERT OR UPDATE OR DELETE ON depenses
  FOR EACH ROW
  EXECUTE FUNCTION cloturer_recettes_automatiquement();

-- 5. Créer une fonction pour réactiver une recette (si nécessaire)
CREATE OR REPLACE FUNCTION reactiver_recette(recette_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE recettes 
  SET statut = 'active',
      updated_at = NOW()
  WHERE id = recette_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Mettre à jour les recettes existantes avec solde = 0
UPDATE recettes 
SET statut = 'cloturee',
    updated_at = NOW()
WHERE id IN (
  SELECT r.id 
  FROM recettes r
  LEFT JOIN depenses d ON d.recette_id = r.id
  GROUP BY r.id, r.montant
  HAVING r.montant - COALESCE(SUM(d.montant), 0) <= 0
);

-- 7. Ajouter des commentaires
COMMENT ON COLUMN recettes.statut IS 'Statut de la recette: active (solde > 0) ou cloturee (solde = 0)';
COMMENT ON FUNCTION cloturer_recettes_automatiquement() IS 'Fonction qui clôture automatiquement les recettes avec solde = 0';
COMMENT ON FUNCTION reactiver_recette(UUID) IS 'Fonction pour réactiver une recette clôturée';

-- 8. Message de confirmation
SELECT 'Migration de clôture des recettes terminée avec succès.' AS status;




















