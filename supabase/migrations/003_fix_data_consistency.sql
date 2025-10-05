-- Migration de correction pour assurer la cohérence des données
-- Cette migration corrige les problèmes de données existantes

-- ✅ S'assurer que tous les budgets ont un type défini
UPDATE budgets 
SET type = 'secondaire' 
WHERE type IS NULL OR type = '';

-- ✅ S'assurer que tous les budgets ont des valeurs numériques valides
UPDATE budgets 
SET 
  spent = COALESCE(spent, 0),
  remaining = COALESCE(remaining, amount)
WHERE spent IS NULL OR remaining IS NULL;

-- ✅ Recalculer le 'remaining' pour tous les budgets
UPDATE budgets 
SET remaining = amount - spent;

-- ✅ S'assurer que toutes les transactions ont un status défini
UPDATE transactions 
SET status = 'completed' 
WHERE status IS NULL OR status = '';

-- ✅ Vérifier l'intégrité des contraintes
-- Si une transaction référence un budget supprimé, mettre budget_id à NULL
UPDATE transactions 
SET budget_id = NULL 
WHERE budget_id IS NOT NULL 
  AND budget_id NOT IN (SELECT id FROM budgets);

-- ✅ Ajouter un index pour améliorer les performances des requêtes de statistiques
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);

-- ✅ Ajouter des commentaires pour documenter la structure
COMMENT ON TABLE budgets IS 'Table des budgets utilisateur - Contient les enveloppes budgétaires principales et secondaires';
COMMENT ON TABLE transactions IS 'Table des transactions - Contient toutes les opérations financières (revenus et dépenses)';
COMMENT ON TABLE categories IS 'Table des catégories personnalisées - Permet aux utilisateurs de créer leurs propres catégories';

COMMENT ON COLUMN budgets.type IS 'Type de budget: principal (compte principal vert) ou secondaire (enveloppe colorée)';
COMMENT ON COLUMN budgets.spent IS 'Montant total dépensé dans ce budget (calculé depuis les transactions)';
COMMENT ON COLUMN budgets.remaining IS 'Montant restant = amount - spent';
COMMENT ON COLUMN budgets.source IS 'Source du montant initial (ex: Salaire, Prêt, Épargne, Remise)';

COMMENT ON COLUMN transactions.type IS 'Type de transaction: income (revenu) ou expense (dépense)';
COMMENT ON COLUMN transactions.status IS 'Statut: completed (terminé), pending (en attente), cancelled (annulé)';
COMMENT ON COLUMN transactions.budget_id IS 'ID du budget associé (peut être NULL si la transaction n est pas liée à un budget)';

-- ✅ Créer une fonction pour mettre à jour automatiquement les statistiques du budget
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer le total dépensé pour le budget associé
  IF NEW.budget_id IS NOT NULL AND NEW.type = 'expense' THEN
    UPDATE budgets
    SET 
      spent = (
        SELECT COALESCE(SUM(ABS(amount)), 0)
        FROM transactions
        WHERE budget_id = NEW.budget_id 
          AND type = 'expense'
          AND status = 'completed'
      ),
      remaining = amount - (
        SELECT COALESCE(SUM(ABS(amount)), 0)
        FROM transactions
        WHERE budget_id = NEW.budget_id 
          AND type = 'expense'
          AND status = 'completed'
      )
    WHERE id = NEW.budget_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Créer un trigger pour mettre à jour automatiquement les budgets
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON transactions;
CREATE TRIGGER trigger_update_budget_spent
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent();

-- ✅ Mettre à jour tous les budgets existants avec les bonnes statistiques
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

-- ✅ Log de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 003_fix_data_consistency terminée avec succès';
  RAISE NOTICE '✅ Tous les budgets ont maintenant des valeurs cohérentes';
  RAISE NOTICE '✅ Les triggers automatiques sont en place pour maintenir la cohérence';
END $$;

