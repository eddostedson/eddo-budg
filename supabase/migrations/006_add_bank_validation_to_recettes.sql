-- Migration pour ajouter la validation bancaire aux recettes
-- Date: 2025-01-27
-- Description: Ajoute un champ pour marquer si le solde de la recette est conforme à ce qui est en banque

-- Ajouter la colonne de validation bancaire
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS validation_bancaire BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne de date de validation
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS date_validation_bancaire TIMESTAMP WITH TIME ZONE;

-- Ajouter un index pour les requêtes de validation
CREATE INDEX IF NOT EXISTS idx_recettes_validation_bancaire ON recettes(validation_bancaire);

-- Commentaires
COMMENT ON COLUMN recettes.validation_bancaire IS 'Indique si le solde de la recette a été validé comme conforme au solde bancaire';
COMMENT ON COLUMN recettes.date_validation_bancaire IS 'Date et heure de la validation bancaire';

-- Mettre à jour la contrainte de statut pour inclure les nouvelles valeurs si nécessaire
-- (Les contraintes existantes restent inchangées)

-- Fonction pour valider une recette
CREATE OR REPLACE FUNCTION valider_recette_bancaire(recette_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE recettes 
  SET 
    validation_bancaire = TRUE,
    date_validation_bancaire = NOW(),
    updated_at = NOW()
  WHERE id = recette_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour invalider une recette
CREATE OR REPLACE FUNCTION invalider_recette_bancaire(recette_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE recettes 
  SET 
    validation_bancaire = FALSE,
    date_validation_bancaire = NULL,
    updated_at = NOW()
  WHERE id = recette_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- RLS pour la validation bancaire (les utilisateurs peuvent modifier leurs propres validations)
-- Les politiques existantes couvrent déjà cette fonctionnalité
