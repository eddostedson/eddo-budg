-- Migration pour créer la table des transferts entre recettes

-- 1. Créer la table transferts
CREATE TABLE IF NOT EXISTS transferts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recette_source_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  recette_destination_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  description TEXT,
  date_transfert DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte pour éviter les transferts vers la même recette
  CONSTRAINT transferts_different_recettes CHECK (recette_source_id != recette_destination_id)
);

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_transferts_user_id ON transferts(user_id);
CREATE INDEX IF NOT EXISTS idx_transferts_recette_source_id ON transferts(recette_source_id);
CREATE INDEX IF NOT EXISTS idx_transferts_recette_destination_id ON transferts(recette_destination_id);
CREATE INDEX IF NOT EXISTS idx_transferts_date_transfert ON transferts(date_transfert);

-- 3. Créer les fonctions pour gérer les soldes
CREATE OR REPLACE FUNCTION incrementer_solde_recette(recette_id UUID, montant DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE recettes 
  SET solde_disponible = solde_disponible + montant,
      updated_at = NOW()
  WHERE id = recette_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrementer_solde_recette(recette_id UUID, montant DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE recettes 
  SET solde_disponible = solde_disponible - montant,
      updated_at = NOW()
  WHERE id = recette_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_transferts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_transferts_updated_at
  BEFORE UPDATE ON transferts
  FOR EACH ROW
  EXECUTE FUNCTION update_transferts_updated_at();

-- 5. Créer les politiques RLS
ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture aux utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users" ON transferts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Enable insert for authenticated users" ON transferts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Enable update for authenticated users" ON transferts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Enable delete for authenticated users" ON transferts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Commentaires
COMMENT ON TABLE transferts IS 'Table des transferts de solde entre recettes';
COMMENT ON COLUMN transferts.recette_source_id IS 'Recette source du transfert';
COMMENT ON COLUMN transferts.recette_destination_id IS 'Recette destination du transfert';
COMMENT ON COLUMN transferts.montant IS 'Montant transféré';
COMMENT ON COLUMN transferts.description IS 'Description du transfert';
COMMENT ON COLUMN transferts.date_transfert IS 'Date du transfert';

-- Message de confirmation
SELECT 'Table transferts créée avec succès avec toutes les contraintes et politiques RLS.' AS status;

