-- Script pour ajouter des contraintes de validation en base de données
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter des contraintes de validation sur la table depenses
ALTER TABLE depenses 
ADD CONSTRAINT check_libelle_not_empty 
CHECK (libelle IS NOT NULL AND trim(libelle) != '');

ALTER TABLE depenses 
ADD CONSTRAINT check_montant_positive 
CHECK (montant > 0);

-- 2. Créer un index pour améliorer les performances de recherche de doublons
CREATE INDEX IF NOT EXISTS idx_depenses_libelle_normalized 
ON depenses (lower(trim(libelle)));

CREATE INDEX IF NOT EXISTS idx_depenses_user_libelle 
ON depenses (user_id, lower(trim(libelle)));

-- 3. Créer une fonction pour détecter les doublons similaires
CREATE OR REPLACE FUNCTION check_similar_depenses(
  p_user_id UUID,
  p_libelle TEXT,
  p_exclude_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  similar_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO similar_count
  FROM depenses
  WHERE user_id = p_user_id
    AND id != COALESCE(p_exclude_id, -1)
    AND (
      -- Vérifier si le libellé est identique (insensible à la casse)
      lower(trim(libelle)) = lower(trim(p_libelle))
      OR
      -- Vérifier si l'un contient l'autre
      lower(trim(libelle)) LIKE '%' || lower(trim(p_libelle)) || '%'
      OR
      lower(trim(p_libelle)) LIKE '%' || lower(trim(libelle)) || '%'
    );
  
  RETURN similar_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une fonction similaire pour les recettes
CREATE OR REPLACE FUNCTION check_similar_recettes(
  p_user_id UUID,
  p_libelle TEXT,
  p_exclude_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  similar_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO similar_count
  FROM recettes
  WHERE user_id = p_user_id
    AND id != COALESCE(p_exclude_id, -1)
    AND (
      lower(trim(libelle)) = lower(trim(p_libelle))
      OR
      lower(trim(libelle)) LIKE '%' || lower(trim(p_libelle)) || '%'
      OR
      lower(trim(p_libelle)) LIKE '%' || lower(trim(libelle)) || '%'
    );
  
  RETURN similar_count > 0;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer des triggers pour valider avant insertion/mise à jour
CREATE OR REPLACE FUNCTION validate_depense_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier les contraintes de base
  IF NEW.libelle IS NULL OR trim(NEW.libelle) = '' THEN
    RAISE EXCEPTION 'Le libellé ne peut pas être vide';
  END IF;
  
  IF NEW.montant <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;
  
  -- Vérifier les doublons similaires
  IF check_similar_depenses(NEW.user_id, NEW.libelle) THEN
    RAISE EXCEPTION 'Une dépense similaire existe déjà pour ce libellé';
  END IF;
  
  -- Nettoyer la description si elle contient le libellé
  IF NEW.description IS NOT NULL AND NEW.description != '' THEN
    IF lower(trim(NEW.description)) LIKE '%' || lower(trim(NEW.libelle)) || '%' THEN
      NEW.description := NULL; -- Supprimer la description redondante
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_depense_before_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier les contraintes de base
  IF NEW.libelle IS NULL OR trim(NEW.libelle) = '' THEN
    RAISE EXCEPTION 'Le libellé ne peut pas être vide';
  END IF;
  
  IF NEW.montant <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;
  
  -- Vérifier les doublons similaires (en excluant l'enregistrement actuel)
  IF check_similar_depenses(NEW.user_id, NEW.libelle, NEW.id) THEN
    RAISE EXCEPTION 'Une dépense similaire existe déjà pour ce libellé';
  END IF;
  
  -- Nettoyer la description si elle contient le libellé
  IF NEW.description IS NOT NULL AND NEW.description != '' THEN
    IF lower(trim(NEW.description)) LIKE '%' || lower(trim(NEW.libelle)) || '%' THEN
      NEW.description := NULL; -- Supprimer la description redondante
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer les triggers
DROP TRIGGER IF EXISTS trigger_validate_depense_insert ON depenses;
CREATE TRIGGER trigger_validate_depense_insert
  BEFORE INSERT ON depenses
  FOR EACH ROW
  EXECUTE FUNCTION validate_depense_before_insert();

DROP TRIGGER IF EXISTS trigger_validate_depense_update ON depenses;
CREATE TRIGGER trigger_validate_depense_update
  BEFORE UPDATE ON depenses
  FOR EACH ROW
  EXECUTE FUNCTION validate_depense_before_update();

-- 7. Créer des fonctions similaires pour les recettes
CREATE OR REPLACE FUNCTION validate_recette_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.libelle IS NULL OR trim(NEW.libelle) = '' THEN
    RAISE EXCEPTION 'Le libellé ne peut pas être vide';
  END IF;
  
  IF NEW.montant <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;
  
  IF check_similar_recettes(NEW.user_id, NEW.libelle) THEN
    RAISE EXCEPTION 'Une recette similaire existe déjà pour ce libellé';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_recette_before_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.libelle IS NULL OR trim(NEW.libelle) = '' THEN
    RAISE EXCEPTION 'Le libellé ne peut pas être vide';
  END IF;
  
  IF NEW.montant <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être positif';
  END IF;
  
  IF check_similar_recettes(NEW.user_id, NEW.libelle, NEW.id) THEN
    RAISE EXCEPTION 'Une recette similaire existe déjà pour ce libellé';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer les triggers pour les recettes
DROP TRIGGER IF EXISTS trigger_validate_recette_insert ON recettes;
CREATE TRIGGER trigger_validate_recette_insert
  BEFORE INSERT ON recettes
  FOR EACH ROW
  EXECUTE FUNCTION validate_recette_before_insert();

DROP TRIGGER IF EXISTS trigger_validate_recette_update ON recettes;
CREATE TRIGGER trigger_validate_recette_update
  BEFORE UPDATE ON recettes
  FOR EACH ROW
  EXECUTE FUNCTION validate_recette_before_update();

-- 9. Créer des index pour les recettes aussi
CREATE INDEX IF NOT EXISTS idx_recettes_libelle_normalized 
ON recettes (lower(trim(libelle)));

CREATE INDEX IF NOT EXISTS idx_recettes_user_libelle 
ON recettes (user_id, lower(trim(libelle)));














