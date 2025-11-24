-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 017 : Ajout du soft delete pour les recettes (corbeille)
-- ═══════════════════════════════════════════════════════════════════════════
-- Permet de restaurer les recettes supprimées

-- 1. Ajouter la colonne deleted_at à la table recettes
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Créer un index pour les requêtes de recettes supprimées
CREATE INDEX IF NOT EXISTS idx_recettes_deleted_at ON recettes(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. Modifier les politiques RLS pour exclure les recettes supprimées par défaut
DROP POLICY IF EXISTS "Users can view their own recettes" ON recettes;
CREATE POLICY "Users can view their own recettes"
  ON recettes FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 4. Créer une politique pour voir les recettes supprimées (pour la corbeille)
CREATE POLICY "Users can view their own deleted recettes"
  ON recettes FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- 5. Créer une fonction pour restaurer une recette
CREATE OR REPLACE FUNCTION restore_recette(recette_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE recettes 
  SET deleted_at = NULL,
      updated_at = NOW()
  WHERE id = recette_id 
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Créer une fonction pour supprimer définitivement une recette (vidage de la corbeille)
CREATE OR REPLACE FUNCTION permanently_delete_recette(recette_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Supprimer les dépenses liées d'abord
  DELETE FROM depenses
  WHERE recette_id = recette_id 
    AND user_id = auth.uid();
  
  -- Supprimer définitivement la recette
  DELETE FROM recettes
  WHERE id = recette_id 
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Commentaire
COMMENT ON COLUMN recettes.deleted_at IS 'Date de suppression (soft delete). NULL = recette active, NOT NULL = recette supprimée';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 017 terminée avec succès !';
  RAISE NOTICE '🗑️ Soft delete activé pour les recettes';
  RAISE NOTICE '♻️ Fonction de restauration créée';
END $$;











