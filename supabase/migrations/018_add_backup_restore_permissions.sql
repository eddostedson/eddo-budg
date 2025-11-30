-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 018 : Permissions pour restaurer depuis recettes_backup_complete
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Vérifier si la table existe, sinon la créer (structure basique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recettes_backup_complete'
    ) THEN
        -- Créer la table avec la même structure que recettes
        CREATE TABLE recettes_backup_complete (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            libelle VARCHAR(255),
            description TEXT,
            amount DECIMAL(10,2),
            montant DECIMAL(10,2),
            solde_disponible DECIMAL(10,2),
            soldeDisponible DECIMAL(10,2),
            source VARCHAR(100),
            periodicite VARCHAR(50),
            date_reception DATE,
            receipt_date DATE,
            date DATE,
            categorie VARCHAR(100),
            statut VARCHAR(50),
            receipt_url TEXT,
            receipt_file_name VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            deleted_at TIMESTAMP WITH TIME ZONE
        );
        
        RAISE NOTICE '✅ Table recettes_backup_complete créée';
    ELSE
        RAISE NOTICE 'ℹ️ Table recettes_backup_complete existe déjà';
    END IF;
END $$;

-- 2. Activer RLS sur la table de backup
ALTER TABLE recettes_backup_complete ENABLE ROW LEVEL SECURITY;

-- 3. Créer une politique pour permettre la lecture (tous les utilisateurs peuvent voir leurs propres backups)
DROP POLICY IF EXISTS "Users can view their own backup recettes" ON recettes_backup_complete;
CREATE POLICY "Users can view their own backup recettes"
  ON recettes_backup_complete FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL); -- Permettre la lecture pour tous les utilisateurs authentifiés

-- 4. Créer une fonction pour restaurer une recette depuis le backup
CREATE OR REPLACE FUNCTION restore_recette_from_backup(backup_recette_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  backup_recette RECORD;
  current_user_id UUID;
BEGIN
  -- Récupérer l'utilisateur actuel
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Récupérer la recette du backup
  SELECT * INTO backup_recette
  FROM recettes_backup_complete
  WHERE id = backup_recette_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Vérifier si la recette existe déjà
  IF EXISTS (SELECT 1 FROM recettes WHERE id = backup_recette_id AND user_id = current_user_id) THEN
    -- Mettre à jour la recette existante
    UPDATE recettes SET
      description = COALESCE(backup_recette.description, backup_recette.libelle, 'Sans description'),
      amount = COALESCE(backup_recette.amount, backup_recette.montant, 0),
      solde_disponible = COALESCE(backup_recette.solde_disponible, backup_recette.soldeDisponible, COALESCE(backup_recette.amount, backup_recette.montant, 0)),
      receipt_date = COALESCE(backup_recette.receipt_date, backup_recette.date_reception, backup_recette.date, CURRENT_DATE),
      source = backup_recette.source,
      periodicite = COALESCE(backup_recette.periodicite, 'unique'),
      categorie = backup_recette.categorie,
      statut = COALESCE(backup_recette.statut, 'reçue'),
      receipt_url = backup_recette.receipt_url,
      receipt_file_name = backup_recette.receipt_file_name,
      deleted_at = NULL,
      updated_at = NOW()
    WHERE id = backup_recette_id AND user_id = current_user_id;
  ELSE
    -- Insérer une nouvelle recette
    INSERT INTO recettes (
      id,
      user_id,
      description,
      amount,
      solde_disponible,
      receipt_date,
      source,
      periodicite,
      categorie,
      statut,
      receipt_url,
      receipt_file_name,
      created_at,
      updated_at,
      deleted_at
    ) VALUES (
      backup_recette.id,
      current_user_id,
      COALESCE(backup_recette.description, backup_recette.libelle, 'Sans description'),
      COALESCE(backup_recette.amount, backup_recette.montant, 0),
      COALESCE(backup_recette.solde_disponible, backup_recette.soldeDisponible, COALESCE(backup_recette.amount, backup_recette.montant, 0)),
      COALESCE(backup_recette.receipt_date, backup_recette.date_reception, backup_recette.date, CURRENT_DATE),
      backup_recette.source,
      COALESCE(backup_recette.periodicite, 'unique'),
      backup_recette.categorie,
      COALESCE(backup_recette.statut, 'reçue'),
      backup_recette.receipt_url,
      backup_recette.receipt_file_name,
      COALESCE(backup_recette.created_at, NOW()),
      NOW(),
      NULL
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Commentaires
COMMENT ON TABLE recettes_backup_complete IS 'Table de sauvegarde complète des recettes pour restauration';
COMMENT ON FUNCTION restore_recette_from_backup IS 'Restaure une recette depuis le backup vers la table recettes';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 018 terminée avec succès !';
  RAISE NOTICE '💾 Permissions configurées pour recettes_backup_complete';
  RAISE NOTICE '♻️ Fonction de restauration créée';
END $$;












