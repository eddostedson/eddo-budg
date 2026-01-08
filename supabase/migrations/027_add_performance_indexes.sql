-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 027 : Optimisations performance (indexes + analyse)
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif : améliorer les temps de réponse des requêtes critiques
--   • transactions_bancaires triées par compte/date/type
--   • stats consolidées pour monitoring
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. INDEXES POUR TRANSACTIONS_BANCAIRES
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_compte_date
  ON transactions_bancaires (compte_id, date_transaction DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_type_date
  ON transactions_bancaires (type_transaction, date_transaction DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_user_date
  ON transactions_bancaires (user_id, date_transaction DESC);

COMMENT ON INDEX idx_transactions_bancaires_compte_date IS
  'Accélère les historiques par compte (liste, solde, exports).';
COMMENT ON INDEX idx_transactions_bancaires_type_date IS
  'Accélère les filtrages par type (crédit/débit) triés chronologiquement.';
COMMENT ON INDEX idx_transactions_bancaires_user_date IS
  'Accélère la récupération globale par utilisateur (tableaux de bord).';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABLE D'ANALYSE RAPIDE (OPTIONNELLE)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS monitoring_query_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  context VARCHAR(120) NOT NULL,
  duration_ms NUMERIC(10,2) NOT NULL,
  rows_returned INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_monitoring_query_stats_context 
  ON monitoring_query_stats (context, recorded_at DESC);

COMMENT ON TABLE monitoring_query_stats IS
  'Historique des temps de réponse (alimenté par le service Monitoring).';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. LOG DE VALIDATION
-- ─────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 027 : Indexes transactions_bancaires créés.';
  RAISE NOTICE '   - idx_transactions_bancaires_compte_date';
  RAISE NOTICE '   - idx_transactions_bancaires_type_date';
  RAISE NOTICE '   - idx_transactions_bancaires_user_date';
  RAISE NOTICE '   - monitoring_query_stats prêt pour les métriques.';
END $$;






