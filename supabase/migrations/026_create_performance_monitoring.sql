-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 026 : Système de Monitoring et Performance
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Cette migration crée un système complet de monitoring basé sur les
-- standards internationaux : Core Web Vitals, RAIL Model, APM Metrics
--
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABLE PERFORMANCE_METRICS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('web_vital', 'api', 'database', 'user', 'system')),
  metric_name VARCHAR(255) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('good', 'needs_improvement', 'poor')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status ON performance_metrics(status);

-- Index composite pour les requêtes d'analyse
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_type_timestamp 
  ON performance_metrics(user_id, metric_type, timestamp DESC);

-- Commentaires
COMMENT ON TABLE performance_metrics IS 'Historique des métriques de performance (Core Web Vitals, APM)';
COMMENT ON COLUMN performance_metrics.metric_type IS 'Type de métrique: web_vital, api, database, user, system';
COMMENT ON COLUMN performance_metrics.metric_name IS 'Nom de la métrique (LCP, FID, CLS, etc.)';
COMMENT ON COLUMN performance_metrics.value IS 'Valeur numérique de la métrique';
COMMENT ON COLUMN performance_metrics.unit IS 'Unité de mesure (ms, MB, rows, etc.)';
COMMENT ON COLUMN performance_metrics.status IS 'État selon standards: good, needs_improvement, poor';
COMMENT ON COLUMN performance_metrics.metadata IS 'Métadonnées additionnelles (JSON)';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABLE PERFORMANCE_ALERTS
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  metric_id UUID REFERENCES performance_metrics(id) ON DELETE SET NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_performance_alerts_user_id ON performance_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity ON performance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_acknowledged ON performance_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_created_at ON performance_alerts(created_at DESC);

-- Commentaires
COMMENT ON TABLE performance_alerts IS 'Alertes de performance basées sur les anomalies détectées';
COMMENT ON COLUMN performance_alerts.severity IS 'Niveau de gravité: low, medium, high, critical';
COMMENT ON COLUMN performance_alerts.acknowledged IS 'Alerte acquittée par l utilisateur';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. VUE POUR RÉSUMÉ PERFORMANCE (Dernières 24h)
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW performance_summary AS
SELECT 
  user_id,
  metric_type,
  metric_name,
  COUNT(*) AS total_measurements,
  AVG(value) AS avg_value,
  MIN(value) AS min_value,
  MAX(value) AS max_value,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) AS median_value,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
  COUNT(CASE WHEN status = 'good' THEN 1 END) AS good_count,
  COUNT(CASE WHEN status = 'needs_improvement' THEN 1 END) AS needs_improvement_count,
  COUNT(CASE WHEN status = 'poor' THEN 1 END) AS poor_count,
  ROUND(COUNT(CASE WHEN status = 'good' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) AS good_percentage
FROM performance_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id, metric_type, metric_name;

COMMENT ON VIEW performance_summary IS 'Résumé des performances par métrique (dernières 24h)';

-- ─────────────────────────────────────────────────────────────────────────
-- 4. FONCTION POUR NETTOYER LES ANCIENNES MÉTRIQUES
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Conserver seulement les 30 derniers jours
  DELETE FROM performance_metrics
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Nettoyage: % anciennes métriques supprimées', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_metrics() IS 'Nettoie les métriques de plus de 30 jours';

-- ─────────────────────────────────────────────────────────────────────────
-- 5. FONCTION POUR CRÉER DES ALERTES AUTOMATIQUES
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_performance_alert()
RETURNS TRIGGER AS $$
DECLARE
  alert_severity VARCHAR(50);
  alert_message TEXT;
BEGIN
  -- Créer une alerte si la métrique est "poor"
  IF NEW.status = 'poor' THEN
    -- Déterminer la sévérité selon le type et la valeur
    IF NEW.metric_type = 'api' AND NEW.value > 5000 THEN
      alert_severity := 'critical';
      alert_message := format('CRITIQUE: %s très lent (%s%s)', NEW.metric_name, NEW.value, NEW.unit);
    ELSIF NEW.metric_type = 'web_vital' AND NEW.value > 4000 THEN
      alert_severity := 'high';
      alert_message := format('URGENT: %s très mauvais (%s%s)', NEW.metric_name, NEW.value, NEW.unit);
    ELSIF NEW.status = 'poor' THEN
      alert_severity := 'medium';
      alert_message := format('ATTENTION: %s nécessite optimisation (%s%s)', NEW.metric_name, NEW.value, NEW.unit);
    END IF;
    
    -- Insérer l'alerte
    INSERT INTO performance_alerts (
      user_id,
      severity,
      alert_type,
      message,
      metric_id
    ) VALUES (
      NEW.user_id,
      alert_severity,
      NEW.metric_type,
      alert_message,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour création automatique d'alertes
CREATE TRIGGER auto_create_performance_alert
  AFTER INSERT ON performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION create_performance_alert();

COMMENT ON FUNCTION create_performance_alert() IS 'Crée automatiquement des alertes pour les métriques en état "poor"';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques pour PERFORMANCE_METRICS
CREATE POLICY "Users can view their own performance_metrics"
  ON performance_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance_metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance_metrics"
  ON performance_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- Politiques pour PERFORMANCE_ALERTS
CREATE POLICY "Users can view their own performance_alerts"
  ON performance_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance_alerts"
  ON performance_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance_alerts"
  ON performance_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. DONNÉES DE RÉFÉRENCE (Standards Internationaux)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(255) NOT NULL UNIQUE,
  good_threshold DECIMAL(15,2) NOT NULL,
  needs_improvement_threshold DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  description TEXT,
  source VARCHAR(255), -- Ex: "Google Core Web Vitals", "RAIL Model"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les standards Core Web Vitals (Google)
INSERT INTO performance_standards (metric_name, good_threshold, needs_improvement_threshold, unit, description, source) VALUES
  ('LCP', 2500, 4000, 'ms', 'Largest Contentful Paint - Temps de chargement du plus grand élément visible', 'Google Core Web Vitals'),
  ('FID', 100, 300, 'ms', 'First Input Delay - Temps de réponse à la première interaction', 'Google Core Web Vitals'),
  ('CLS', 0.1, 0.25, 'score', 'Cumulative Layout Shift - Stabilité visuelle', 'Google Core Web Vitals'),
  ('FCP', 1800, 3000, 'ms', 'First Contentful Paint - Temps d affichage du premier contenu', 'Google Core Web Vitals'),
  ('TTFB', 800, 1800, 'ms', 'Time to First Byte - Temps de réponse du serveur', 'Google Core Web Vitals'),
  ('API Response Time', 100, 1000, 'ms', 'Temps de réponse API standard', 'APM Best Practices'),
  ('Database Query Time', 100, 500, 'ms', 'Temps d exécution requête BD standard', 'APM Best Practices'),
  ('Memory Usage', 50, 100, 'MB', 'Utilisation mémoire JavaScript', 'Browser Performance'),
  ('Cache Hit Rate', 80, 60, '%', 'Taux de succès du cache', 'APM Best Practices')
ON CONFLICT (metric_name) DO NOTHING;

COMMENT ON TABLE performance_standards IS 'Standards internationaux de performance (Google, RAIL, APM)';

-- ═══════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration 026 : Système de Monitoring créé avec succès !';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Tables créées :';
  RAISE NOTICE '  • performance_metrics (historique)';
  RAISE NOTICE '  • performance_alerts (alertes automatiques)';
  RAISE NOTICE '  • performance_standards (standards internationaux)';
  RAISE NOTICE '';
  RAISE NOTICE 'Vues créées :';
  RAISE NOTICE '  • performance_summary (résumé 24h)';
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions créées :';
  RAISE NOTICE '  • cleanup_old_metrics() (nettoyage auto)';
  RAISE NOTICE '  • create_performance_alert() (alertes auto)';
  RAISE NOTICE '';
  RAISE NOTICE 'Standards chargés : Core Web Vitals + APM Metrics';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;





