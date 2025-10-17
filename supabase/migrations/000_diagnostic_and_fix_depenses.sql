-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC ET CRÉATION DE LA TABLE DEPENSES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Ce script vérifie si la table depenses existe et la crée si nécessaire
-- avec TOUTES les colonnes requises par l'application
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 1 : DIAGNOSTIC - Vérifier si la table existe
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔍 DIAGNOSTIC DE LA TABLE DEPENSES';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier si la table existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'depenses'
    ) THEN
        RAISE NOTICE '✅ La table depenses existe';
        
        -- Lister les colonnes existantes
        RAISE NOTICE '';
        RAISE NOTICE '📊 Colonnes existantes :';
        FOR rec IN (
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'depenses'
            ORDER BY ordinal_position
        ) LOOP
            RAISE NOTICE '   • % (%)', rec.column_name, rec.data_type;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ La table depenses N''EXISTE PAS !';
        RAISE NOTICE '➡️  Elle va être créée maintenant...';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 2 : CRÉER LA TABLE DEPENSES SI ELLE N'EXISTE PAS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.depenses (
  -- Colonnes de base
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  recette_id UUID REFERENCES public.recettes(id) ON DELETE SET NULL,
  
  -- Informations de la dépense
  libelle VARCHAR(255) NOT NULL,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  categorie VARCHAR(100),
  
  -- Gestion des reçus
  receipt_url TEXT,
  receipt_file_name VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 3 : CRÉER LES INDEX POUR OPTIMISER LES PERFORMANCES
-- ─────────────────────────────────────────────────────────────────────────

-- Index de base
CREATE INDEX IF NOT EXISTS idx_depenses_user_id ON public.depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_depenses_budget_id ON public.depenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_depenses_recette_id ON public.depenses(recette_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date ON public.depenses(date);
CREATE INDEX IF NOT EXISTS idx_depenses_libelle ON public.depenses(libelle);

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON public.depenses(categorie);
CREATE INDEX IF NOT EXISTS idx_depenses_receipt ON public.depenses(receipt_url) WHERE receipt_url IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 4 : AJOUTER DES COMMENTAIRES DESCRIPTIFS
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.depenses IS 'Table des dépenses effectuées par les utilisateurs';
COMMENT ON COLUMN public.depenses.id IS 'Identifiant unique de la dépense';
COMMENT ON COLUMN public.depenses.user_id IS 'Utilisateur propriétaire de la dépense';
COMMENT ON COLUMN public.depenses.budget_id IS 'Budget sur lequel la dépense est imputée (optionnel)';
COMMENT ON COLUMN public.depenses.recette_id IS 'Recette source de la dépense (optionnel)';
COMMENT ON COLUMN public.depenses.libelle IS 'Libellé de la dépense (ex: Courses Carrefour)';
COMMENT ON COLUMN public.depenses.montant IS 'Montant de la dépense';
COMMENT ON COLUMN public.depenses.date IS 'Date de la dépense';
COMMENT ON COLUMN public.depenses.description IS 'Description détaillée de la dépense';
COMMENT ON COLUMN public.depenses.categorie IS 'Catégorie de la dépense (ex: Alimentation, Transport, Santé)';
COMMENT ON COLUMN public.depenses.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN public.depenses.receipt_file_name IS 'Nom du fichier du reçu';

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 5 : CRÉER LE TRIGGER POUR updated_at
-- ─────────────────────────────────────────────────────────────────────────

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_depenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS trigger_depenses_updated_at ON public.depenses;
CREATE TRIGGER trigger_depenses_updated_at
  BEFORE UPDATE ON public.depenses
  FOR EACH ROW
  EXECUTE FUNCTION update_depenses_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 6 : ACTIVER ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres dépenses
DROP POLICY IF EXISTS "Users can view their own depenses" ON public.depenses;
CREATE POLICY "Users can view their own depenses"
  ON public.depenses FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent créer leurs propres dépenses
DROP POLICY IF EXISTS "Users can insert their own depenses" ON public.depenses;
CREATE POLICY "Users can insert their own depenses"
  ON public.depenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent modifier leurs propres dépenses
DROP POLICY IF EXISTS "Users can update their own depenses" ON public.depenses;
CREATE POLICY "Users can update their own depenses"
  ON public.depenses FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres dépenses
DROP POLICY IF EXISTS "Users can delete their own depenses" ON public.depenses;
CREATE POLICY "Users can delete their own depenses"
  ON public.depenses FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- ÉTAPE 7 : CRÉER LE TRIGGER DE DÉDUCTION DU SOLDE RECETTE
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION deduire_solde_recette()
RETURNS TRIGGER AS $$
BEGIN
    -- Lors de l'insertion d'une dépense liée à une recette
    IF (TG_OP = 'INSERT' AND NEW.recette_id IS NOT NULL) THEN
        UPDATE public.recettes
        SET solde_disponible = solde_disponible - NEW.montant,
            updated_at = NOW()
        WHERE id = NEW.recette_id;
    END IF;

    -- Lors de la mise à jour d'une dépense
    IF (TG_OP = 'UPDATE') THEN
        -- Si la recette a changé, rembourser l'ancienne et déduire de la nouvelle
        IF (OLD.recette_id IS DISTINCT FROM NEW.recette_id) THEN
            -- Rembourser l'ancienne recette
            IF (OLD.recette_id IS NOT NULL) THEN
                UPDATE public.recettes
                SET solde_disponible = solde_disponible + OLD.montant,
                    updated_at = NOW()
                WHERE id = OLD.recette_id;
            END IF;
            
            -- Déduire de la nouvelle recette
            IF (NEW.recette_id IS NOT NULL) THEN
                UPDATE public.recettes
                SET solde_disponible = solde_disponible - NEW.montant,
                    updated_at = NOW()
                WHERE id = NEW.recette_id;
            END IF;
        -- Si seul le montant a changé
        ELSIF (OLD.montant <> NEW.montant AND NEW.recette_id IS NOT NULL) THEN
            UPDATE public.recettes
            SET solde_disponible = solde_disponible + OLD.montant - NEW.montant,
                updated_at = NOW()
            WHERE id = NEW.recette_id;
        END IF;
    END IF;

    -- Lors de la suppression d'une dépense
    IF (TG_OP = 'DELETE' AND OLD.recette_id IS NOT NULL) THEN
        UPDATE public.recettes
        SET solde_disponible = solde_disponible + OLD.montant,
            updated_at = NOW()
        WHERE id = OLD.recette_id;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_deduire_solde_recette ON public.depenses;
CREATE TRIGGER trigger_deduire_solde_recette
AFTER INSERT OR UPDATE OR DELETE ON public.depenses
FOR EACH ROW
EXECUTE FUNCTION deduire_solde_recette();

-- ═══════════════════════════════════════════════════════════════════════════
-- MESSAGE DE CONFIRMATION FINAL
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    col_count INTEGER;
BEGIN
    -- Compter les colonnes
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'depenses';

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ CRÉATION DE LA TABLE DEPENSES - TERMINÉE !';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Statistiques :';
    RAISE NOTICE '   • Nombre de colonnes : %s', col_count;
    RAISE NOTICE '   • Index créés : 7';
    RAISE NOTICE '   • Triggers actifs : 2 (updated_at + déduction solde)';
    RAISE NOTICE '   • RLS activé : OUI';
    RAISE NOTICE '   • Politiques RLS : 4 (SELECT, INSERT, UPDATE, DELETE)';
    RAISE NOTICE '';
    RAISE NOTICE '✨ Colonnes principales :';
    RAISE NOTICE '   • id, user_id, budget_id, recette_id';
    RAISE NOTICE '   • libelle, montant, date, description';
    RAISE NOTICE '   • categorie (✅ NOUVEAU)';
    RAISE NOTICE '   • receipt_url, receipt_file_name (✅ NOUVEAU)';
    RAISE NOTICE '   • created_at, updated_at';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Vous pouvez maintenant créer des dépenses avec catégories et reçus !';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

