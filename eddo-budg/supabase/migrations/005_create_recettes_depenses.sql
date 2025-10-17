-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005 : Création du système RECETTES → BUDGETS → DÉPENSES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cette migration crée une architecture comptable classique :
-- 1. RECETTES : Sources de revenus (Salaire, Prime, etc.)
-- 2. BUDGETS : Enveloppes pour organiser (Alimentation, Transport, etc.)
-- 3. DÉPENSES : Sorties d'argent réelles
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. CRÉER LA TABLE RECETTES
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  libelle VARCHAR(255) NOT NULL,
  description TEXT,
  montant DECIMAL(10,2) NOT NULL CHECK (montant >= 0),
  solde_disponible DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (solde_disponible >= 0),
  source VARCHAR(100),
  periodicite VARCHAR(50) DEFAULT 'unique',
  date_reception DATE DEFAULT CURRENT_DATE,
  categorie VARCHAR(100),
  statut VARCHAR(50) DEFAULT 'reçue' CHECK (statut IN ('attendue', 'reçue', 'retardée', 'annulée')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_recettes_user_id ON recettes(user_id);
CREATE INDEX idx_recettes_statut ON recettes(statut);
CREATE INDEX idx_recettes_date ON recettes(date_reception);

-- Commentaires
COMMENT ON TABLE recettes IS 'Table des recettes (revenus) de l''utilisateur';
COMMENT ON COLUMN recettes.libelle IS 'Libellé de la recette (ex: Salaire Janvier 2025)';
COMMENT ON COLUMN recettes.montant IS 'Montant initial de la recette';
COMMENT ON COLUMN recettes.solde_disponible IS 'Montant restant disponible (non alloué aux budgets)';
COMMENT ON COLUMN recettes.source IS 'Source du revenu (Salaire, Prime, Freelance, etc.)';
COMMENT ON COLUMN recettes.periodicite IS 'Périodicité (unique, mensuelle, hebdomadaire, annuelle)';
COMMENT ON COLUMN recettes.statut IS 'Statut de la recette (attendue, reçue, retardée, annulée)';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. CRÉER LA TABLE DÉPENSES
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS depenses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  libelle VARCHAR(255) NOT NULL,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_depenses_user_id ON depenses(user_id);
CREATE INDEX idx_depenses_budget_id ON depenses(budget_id);
CREATE INDEX idx_depenses_date ON depenses(date);
CREATE INDEX idx_depenses_libelle ON depenses(libelle);

-- Commentaires
COMMENT ON TABLE depenses IS 'Table des dépenses effectuées sur les budgets';
COMMENT ON COLUMN depenses.libelle IS 'Libellé de la dépense (ex: Courses Carrefour)';
COMMENT ON COLUMN depenses.budget_id IS 'Budget sur lequel la dépense est imputée';
COMMENT ON COLUMN depenses.montant IS 'Montant de la dépense';
COMMENT ON COLUMN depenses.date IS 'Date de la dépense';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CRÉER LA TABLE ALLOCATIONS (Recettes → Budgets)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS allocations (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recette_id UUID NOT NULL REFERENCES recettes(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL CHECK (montant > 0),
  date_allocation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_allocations_recette_id ON allocations(recette_id);
CREATE INDEX idx_allocations_budget_id ON allocations(budget_id);

-- Commentaires
COMMENT ON TABLE allocations IS 'Table des allocations de recettes vers les budgets';
COMMENT ON COLUMN allocations.recette_id IS 'Recette source';
COMMENT ON COLUMN allocations.budget_id IS 'Budget destination';
COMMENT ON COLUMN allocations.montant IS 'Montant alloué';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS AUTOMATIQUES
-- ─────────────────────────────────────────────────────────────────────────

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
DROP TRIGGER IF EXISTS trigger_recettes_updated_at ON recettes;
CREATE TRIGGER trigger_recettes_updated_at
  BEFORE UPDATE ON recettes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_depenses_updated_at ON depenses;
CREATE TRIGGER trigger_depenses_updated_at
  BEFORE UPDATE ON depenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 5. TRIGGER : Mettre à jour le solde de la recette après allocation
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_recette_solde()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer le solde disponible de la recette
  UPDATE recettes
  SET solde_disponible = montant - (
    SELECT COALESCE(SUM(montant), 0)
    FROM allocations
    WHERE recette_id = NEW.recette_id
  )
  WHERE id = NEW.recette_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_recette_solde ON allocations;
CREATE TRIGGER trigger_update_recette_solde
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_recette_solde();

-- ─────────────────────────────────────────────────────────────────────────
-- 6. TRIGGER : Mettre à jour le budget après allocation
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_budget_from_allocation()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer le montant du budget (somme des allocations)
  UPDATE budgets
  SET amount = (
    SELECT COALESCE(SUM(montant), 0)
    FROM allocations
    WHERE budget_id = NEW.budget_id
  )
  WHERE id = NEW.budget_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_budget_allocation ON allocations;
CREATE TRIGGER trigger_update_budget_allocation
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_from_allocation();

-- ─────────────────────────────────────────────────────────────────────────
-- 7. TRIGGER : Mettre à jour le budget après dépense
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_budget_after_depense()
RETURNS TRIGGER AS $$
DECLARE
  total_depenses DECIMAL(10,2);
  total_allocations DECIMAL(10,2);
BEGIN
  -- Calculer le total des dépenses pour ce budget
  SELECT COALESCE(SUM(montant), 0) INTO total_depenses
  FROM depenses
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Calculer le total des allocations pour ce budget
  SELECT COALESCE(SUM(montant), 0) INTO total_allocations
  FROM allocations
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Mettre à jour le budget
  UPDATE budgets
  SET 
    amount = total_allocations,
    spent = total_depenses,
    remaining = total_allocations - total_depenses
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_budget_depense ON depenses;
CREATE TRIGGER trigger_update_budget_depense
  AFTER INSERT OR UPDATE OR DELETE ON depenses
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_after_depense();

-- ─────────────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────

-- Activer RLS
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

-- Politiques pour RECETTES
CREATE POLICY "Users can view their own recettes"
  ON recettes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recettes"
  ON recettes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recettes"
  ON recettes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recettes"
  ON recettes FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour DÉPENSES
CREATE POLICY "Users can view their own depenses"
  ON depenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own depenses"
  ON depenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own depenses"
  ON depenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own depenses"
  ON depenses FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour ALLOCATIONS
CREATE POLICY "Users can view their own allocations"
  ON allocations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allocations"
  ON allocations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allocations"
  ON allocations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allocations"
  ON allocations FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. INITIALISER LES SOLDES DES RECETTES EXISTANTES
-- ─────────────────────────────────────────────────────────────────────────

-- Si des recettes existent déjà, initialiser leur solde
UPDATE recettes
SET solde_disponible = montant
WHERE solde_disponible = 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE LA MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005 terminée avec succès !';
  RAISE NOTICE '📊 Tables créées : recettes, depenses, allocations';
  RAISE NOTICE '🔒 RLS activé sur toutes les tables';
  RAISE NOTICE '⚡ Triggers automatiques configurés';
END $$;

