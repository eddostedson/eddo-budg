-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 016 : Ajouter les colonnes manquantes à la table depenses
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Problème : Plusieurs colonnes n'existent pas dans la table depenses
-- Solution : Ajouter categorie, receipt_url et receipt_file_name
--
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ajouter la colonne 'categorie'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'depenses' 
        AND column_name = 'categorie'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne categorie...';
        
        ALTER TABLE public.depenses 
        ADD COLUMN categorie VARCHAR(100);
        
        -- Mettre à jour les enregistrements existants avec une catégorie par défaut
        UPDATE public.depenses 
        SET categorie = 'Non catégorisé' 
        WHERE categorie IS NULL;
        
        RAISE NOTICE '✅ Colonne categorie ajoutée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️ La colonne categorie existe déjà';
    END IF;
END $$;

-- 2. Ajouter la colonne 'receipt_url' pour les reçus
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'depenses' 
        AND column_name = 'receipt_url'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne receipt_url...';
        
        ALTER TABLE public.depenses 
        ADD COLUMN receipt_url TEXT;
        
        RAISE NOTICE '✅ Colonne receipt_url ajoutée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️ La colonne receipt_url existe déjà';
    END IF;
END $$;

-- 3. Ajouter la colonne 'receipt_file_name' pour les noms de fichiers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'depenses' 
        AND column_name = 'receipt_file_name'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne receipt_file_name...';
        
        ALTER TABLE public.depenses 
        ADD COLUMN receipt_file_name VARCHAR(255);
        
        RAISE NOTICE '✅ Colonne receipt_file_name ajoutée avec succès';
    ELSE
        RAISE NOTICE 'ℹ️ La colonne receipt_file_name existe déjà';
    END IF;
END $$;

-- 4. Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON public.depenses(categorie);
CREATE INDEX IF NOT EXISTS idx_depenses_receipt ON public.depenses(receipt_url) WHERE receipt_url IS NOT NULL;

-- 5. Ajouter des commentaires
COMMENT ON COLUMN public.depenses.categorie IS 'Catégorie de la dépense (ex: Alimentation, Transport, Santé, etc.)';
COMMENT ON COLUMN public.depenses.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN public.depenses.receipt_file_name IS 'Nom du fichier du reçu';

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Message de confirmation final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration 016 terminée avec succès !';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Colonnes ajoutées à la table depenses :';
  RAISE NOTICE '   1. categorie (VARCHAR 100) - Catégorie de la dépense';
  RAISE NOTICE '   2. receipt_url (TEXT) - URL du reçu dans Supabase Storage';
  RAISE NOTICE '   3. receipt_file_name (VARCHAR 255) - Nom du fichier du reçu';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Index créés :';
  RAISE NOTICE '   • idx_depenses_categorie';
  RAISE NOTICE '   • idx_depenses_receipt';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Total de dépenses dans la base : %s', (SELECT COUNT(*) FROM public.depenses);
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
END $$;

