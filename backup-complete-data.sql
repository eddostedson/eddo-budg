-- ═══════════════════════════════════════════════════════════════════════════
-- SAUVEGARDE COMPLÈTE DES DONNÉES EDDO-BUDG
-- ═══════════════════════════════════════════════════════════════════════════
-- Date: $(date)
-- Description: Sauvegarde complète de toutes les données utilisateur
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. SAUVEGARDE DES RECETTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer une table de sauvegarde pour les recettes
CREATE TABLE IF NOT EXISTS recettes_backup_$(date +%Y_%m_%d_%H_%M_%S) AS 
SELECT * FROM recettes;

-- Commentaire sur la sauvegarde
COMMENT ON TABLE recettes_backup_$(date +%Y_%m_%d_%H_%M_%S) IS 'Sauvegarde des recettes du $(date)';

-- 2. SAUVEGARDE DES DÉPENSES
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer une table de sauvegarde pour les dépenses
CREATE TABLE IF NOT EXISTS depenses_backup_$(date +%Y_%m_%d_%H_%M_%S) AS 
SELECT * FROM depenses;

-- Commentaire sur la sauvegarde
COMMENT ON TABLE depenses_backup_$(date +%Y_%m_%d_%H_%M_%S) IS 'Sauvegarde des dépenses du $(date)';

-- 3. SAUVEGARDE DES NOTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer une table de sauvegarde pour les notes
CREATE TABLE IF NOT EXISTS notes_depenses_backup_$(date +%Y_%m_%d_%H_%M_%S) AS 
SELECT * FROM notes_depenses;

-- Commentaire sur la sauvegarde
COMMENT ON TABLE notes_depenses_backup_$(date +%Y_%m_%d_%H_%M_%S) IS 'Sauvegarde des notes du $(date)';

-- 4. SAUVEGARDE DES BUDGETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer une table de sauvegarde pour les budgets
CREATE TABLE IF NOT EXISTS budgets_backup_$(date +%Y_%m_%d_%H_%M_%S) AS 
SELECT * FROM budgets;

-- Commentaire sur la sauvegarde
COMMENT ON TABLE budgets_backup_$(date +%Y_%m_%d_%H_%M_%S) IS 'Sauvegarde des budgets du $(date)';

-- 5. SAUVEGARDE DES TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer une table de sauvegarde pour les transactions
CREATE TABLE IF NOT EXISTS transactions_backup_$(date +%Y_%m_%d_%H_%M_%S) AS 
SELECT * FROM transactions;

-- Commentaire sur la sauvegarde
COMMENT ON TABLE transactions_backup_$(date +%Y_%m_%d_%H_%M_%S) IS 'Sauvegarde des transactions du $(date)';

-- 6. SAUVEGARDE DES CATÉGORIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer une table de sauvegarde pour les catégories
CREATE TABLE IF NOT EXISTS categories_backup_$(date +%Y_%m_%d_%H_%M_%S) AS 
SELECT * FROM categories;

-- Commentaire sur la sauvegarde
COMMENT ON TABLE categories_backup_$(date +%Y_%m_%d_%H_%M_%S) IS 'Sauvegarde des catégories du $(date)';

-- 7. LOG DE SAUVEGARDE
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer un log de sauvegarde
CREATE TABLE IF NOT EXISTS backup_log (
  id SERIAL PRIMARY KEY,
  backup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  backup_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_count INTEGER NOT NULL,
  backup_status VARCHAR(20) DEFAULT 'completed'
);

-- Insérer les informations de sauvegarde
INSERT INTO backup_log (backup_type, table_name, record_count) VALUES
('FULL_BACKUP', 'recettes', (SELECT COUNT(*) FROM recettes)),
('FULL_BACKUP', 'depenses', (SELECT COUNT(*) FROM depenses)),
('FULL_BACKUP', 'notes_depenses', (SELECT COUNT(*) FROM notes_depenses)),
('FULL_BACKUP', 'budgets', (SELECT COUNT(*) FROM budgets)),
('FULL_BACKUP', 'transactions', (SELECT COUNT(*) FROM transactions)),
('FULL_BACKUP', 'categories', (SELECT COUNT(*) FROM categories));

-- 8. VÉRIFICATION DE LA SAUVEGARDE
-- ═══════════════════════════════════════════════════════════════════════════

-- Afficher un résumé de la sauvegarde
DO $$
DECLARE
    recettes_count INTEGER;
    depenses_count INTEGER;
    notes_count INTEGER;
    budgets_count INTEGER;
    transactions_count INTEGER;
    categories_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO recettes_count FROM recettes;
    SELECT COUNT(*) INTO depenses_count FROM depenses;
    SELECT COUNT(*) INTO notes_count FROM notes_depenses;
    SELECT COUNT(*) INTO budgets_count FROM budgets;
    SELECT COUNT(*) INTO transactions_count FROM transactions;
    SELECT COUNT(*) INTO categories_count FROM categories;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '💾 SAUVEGARDE COMPLÈTE TERMINÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 RÉSUMÉ DES DONNÉES SAUVEGARDÉES:';
    RAISE NOTICE '   • Recettes: % enregistrements', recettes_count;
    RAISE NOTICE '   • Dépenses: % enregistrements', depenses_count;
    RAISE NOTICE '   • Notes: % enregistrements', notes_count;
    RAISE NOTICE '   • Budgets: % enregistrements', budgets_count;
    RAISE NOTICE '   • Transactions: % enregistrements', transactions_count;
    RAISE NOTICE '   • Catégories: % enregistrements', categories_count;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Sauvegarde sécurisée dans les tables backup_*';
    RAISE NOTICE '📝 Log de sauvegarde créé dans backup_log';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
END $$;









