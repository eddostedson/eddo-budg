-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 003 : Schéma complet avec triggers automatiques
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cette migration ajoute :
-- - Colonnes manquantes (type, source)
-- - Index de performance
-- - Trigger de recalcul automatique des statistiques
-- - Documentation complète
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Ajouter la colonne type si elle n'existe pas
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'secondaire' CHECK (type IN ('principal', 'secondaire'));

-- Ajouter la colonne source si elle n'existe pas
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '';

-- S'assurer que spent et remaining existent
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS spent DECIMAL(10,2) DEFAULT 0;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS remaining DECIMAL(10,2);

-- Initialiser remaining si NULL
UPDATE budgets SET remaining = amount WHERE remaining IS NULL;

-- Index supplémentaires
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Fonction de recalcul automatique
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  target_budget_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_budget_id := OLD.budget_id;
  ELSE
    target_budget_id := NEW.budget_id;
  END IF;
  
  IF target_budget_id IS NOT NULL THEN
    UPDATE budgets
    SET 
      spent = (
        SELECT COALESCE(SUM(ABS(amount)), 0)
        FROM transactions
        WHERE budget_id = target_budget_id
          AND type = 'expense'
          AND status = 'completed'
      ),
      remaining = amount - (
        SELECT COALESCE(SUM(ABS(amount)), 0)
        FROM transactions
        WHERE budget_id = target_budget_id
          AND type = 'expense'
          AND status = 'completed'
      )
    WHERE id = target_budget_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger de recalcul automatique
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON transactions;
CREATE TRIGGER trigger_update_budget_spent
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent();

-- Documentation
COMMENT ON COLUMN budgets.type IS 'Type de budget: principal (compte principal vert) ou secondaire (enveloppe colorée)';
COMMENT ON COLUMN budgets.spent IS 'Montant total dépensé (calculé automatiquement depuis les transactions)';
COMMENT ON COLUMN budgets.remaining IS 'Montant restant = amount - spent (calculé automatiquement)';
COMMENT ON COLUMN budgets.source IS 'Source du montant initial (ex: Salaire, Prêt, Épargne, Remise)';

-- Recalculer tous les budgets existants
UPDATE budgets b
SET 
  spent = COALESCE((
    SELECT SUM(ABS(amount))
    FROM transactions t
    WHERE t.budget_id = b.id 
      AND t.type = 'expense'
      AND t.status = 'completed'
  ), 0),
  remaining = b.amount - COALESCE((
    SELECT SUM(ABS(amount))
    FROM transactions t
    WHERE t.budget_id = b.id 
      AND t.type = 'expense'
      AND t.status = 'completed'
  ), 0);

