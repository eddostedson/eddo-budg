-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 004 : Correction du trigger pour inclure les revenus
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cette migration corrige le trigger pour que :
-- - Les REVENUS augmentent le montant disponible
-- - Les DÉPENSES diminuent le montant disponible
--
-- Formule : Restant = Montant initial + Revenus - Dépenses
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON transactions;

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS update_budget_spent();

-- Créer la nouvelle fonction avec gestion des revenus
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  target_budget_id UUID;
  total_income DECIMAL(10,2);
  total_expenses DECIMAL(10,2);
BEGIN
  -- Déterminer quel budget_id utiliser
  IF TG_OP = 'DELETE' THEN
    target_budget_id := OLD.budget_id;
  ELSE
    target_budget_id := NEW.budget_id;
  END IF;
  
  -- Recalculer seulement si budget_id existe
  IF target_budget_id IS NOT NULL THEN
    
    -- Calculer le total des REVENUS
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_income
    FROM transactions
    WHERE budget_id = target_budget_id
      AND type = 'income'
      AND status = 'completed';
    
    -- Calculer le total des DÉPENSES
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_expenses
    FROM transactions
    WHERE budget_id = target_budget_id
      AND type = 'expense'
      AND status = 'completed';
    
    -- Mettre à jour le budget
    UPDATE budgets
    SET 
      spent = total_expenses,
      remaining = amount + total_income - total_expenses
    WHERE id = target_budget_id;
    
    -- Log pour debug
    RAISE NOTICE 'Budget % mis à jour - Revenus: %, Dépenses: %', 
      target_budget_id, total_income, total_expenses;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_update_budget_spent
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_spent();

-- Recalculer tous les budgets existants avec la nouvelle logique
DO $$
DECLARE
  budget_record RECORD;
  total_income DECIMAL(10,2);
  total_expenses DECIMAL(10,2);
BEGIN
  RAISE NOTICE '🔄 Recalcul de tous les budgets avec revenus et dépenses...';
  
  FOR budget_record IN SELECT id, amount FROM budgets LOOP
    
    -- Calculer les revenus pour ce budget
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_income
    FROM transactions
    WHERE budget_id = budget_record.id
      AND type = 'income'
      AND status = 'completed';
    
    -- Calculer les dépenses pour ce budget
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_expenses
    FROM transactions
    WHERE budget_id = budget_record.id
      AND type = 'expense'
      AND status = 'completed';
    
    -- Mettre à jour
    UPDATE budgets
    SET 
      spent = total_expenses,
      remaining = budget_record.amount + total_income - total_expenses
    WHERE id = budget_record.id;
    
    RAISE NOTICE '✅ Budget % - Initial: %, Revenus: %, Dépenses: %, Restant: %',
      budget_record.id, 
      budget_record.amount,
      total_income,
      total_expenses,
      (budget_record.amount + total_income - total_expenses);
  END LOOP;
  
  RAISE NOTICE '🎉 Recalcul terminé !';
END $$;

-- Documentation
COMMENT ON FUNCTION update_budget_spent() IS 
  'Recalcule automatiquement le montant dépensé et restant d''un budget.
   Formule : remaining = amount + revenus - dépenses';

