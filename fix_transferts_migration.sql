-- Script de correction pour la migration des transferts
-- Gère les éléments qui pourraient déjà exister

-- 1. Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_transferts_updated_at ON transferts;
DROP TRIGGER IF EXISTS trigger_incrementer_solde_recette ON transferts;
DROP TRIGGER IF EXISTS trigger_decrementer_solde_recette ON transferts;

-- 2. Supprimer les fonctions existantes s'ils existent
DROP FUNCTION IF EXISTS incrementer_solde_recette();
DROP FUNCTION IF EXISTS decrementer_solde_recette();

-- 3. Supprimer la table transferts si elle existe (pour repartir à zéro)
DROP TABLE IF EXISTS transferts CASCADE;

-- 4. Créer la table transferts
CREATE TABLE transferts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recette_source_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  recette_destination_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  date_transfert DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes de validation
  CONSTRAINT transferts_montant_positive CHECK (montant > 0),
  CONSTRAINT transferts_different_recettes CHECK (recette_source_id != recette_destination_id)
);

-- 5. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_transferts_user_id ON transferts(user_id);
CREATE INDEX IF NOT EXISTS idx_transferts_recette_source_id ON transferts(recette_source_id);
CREATE INDEX IF NOT EXISTS idx_transferts_recette_destination_id ON transferts(recette_destination_id);
CREATE INDEX IF NOT EXISTS idx_transferts_date_transfert ON transferts(date_transfert);

-- 6. Créer la fonction pour incrémenter le solde d'une recette
CREATE OR REPLACE FUNCTION incrementer_solde_recette()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter le solde de la recette destination
  UPDATE recettes
  SET solde_disponible = solde_disponible + NEW.montant,
      updated_at = NOW()
  WHERE id = NEW.recette_destination_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer la fonction pour décrémenter le solde d'une recette
CREATE OR REPLACE FUNCTION decrementer_solde_recette()
RETURNS TRIGGER AS $$
BEGIN
  -- Décrémenter le solde de la recette source
  UPDATE recettes
  SET solde_disponible = solde_disponible - NEW.montant,
      updated_at = NOW()
  WHERE id = NEW.recette_source_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer la fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Créer les triggers
CREATE TRIGGER trigger_transferts_updated_at
  BEFORE UPDATE ON transferts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_incrementer_solde_recette
  AFTER INSERT ON transferts
  FOR EACH ROW
  EXECUTE FUNCTION incrementer_solde_recette();

CREATE TRIGGER trigger_decrementer_solde_recette
  AFTER INSERT ON transferts
  FOR EACH ROW
  EXECUTE FUNCTION decrementer_solde_recette();

-- 10. Activer RLS (Row Level Security)
ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;

-- 11. Créer les politiques RLS
CREATE POLICY "Enable insert for authenticated users only" ON "public"."transferts"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for authenticated users only" ON "public"."transferts"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for authenticated users only" ON "public"."transferts"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for authenticated users only" ON "public"."transferts"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 12. Ajouter les commentaires
COMMENT ON TABLE transferts IS 'Table des transferts de fonds entre recettes';
COMMENT ON COLUMN transferts.recette_source_id IS 'ID de la recette source (qui perd le montant)';
COMMENT ON COLUMN transferts.recette_destination_id IS 'ID de la recette destination (qui reçoit le montant)';
COMMENT ON COLUMN transferts.montant IS 'Montant transféré';
COMMENT ON COLUMN transferts.description IS 'Description du transfert (optionnel)';
COMMENT ON COLUMN transferts.date_transfert IS 'Date du transfert';

-- 13. Message de confirmation
SELECT 'Table transferts créée avec succès avec toutes les contraintes et politiques RLS.' AS status;


































