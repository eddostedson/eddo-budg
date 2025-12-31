-- Script pour ajouter les colonnes de reçus à la table transactions_bancaires
-- Exécuter dans l'éditeur SQL de Supabase

-- ===========================================
-- 1. VÉRIFIER LA STRUCTURE ACTUELLE
-- ===========================================
SELECT 'Structure actuelle de la table transactions_bancaires:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions_bancaires' 
ORDER BY ordinal_position;

-- ===========================================
-- 2. AJOUTER LES COLONNES DE REÇUS
-- ===========================================
ALTER TABLE transactions_bancaires 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- ===========================================
-- 3. VÉRIFIER QUE LES COLONNES ONT ÉTÉ AJOUTÉES
-- ===========================================
SELECT 'Colonnes ajoutées à transactions_bancaires:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions_bancaires' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

-- ===========================================
-- 4. AJOUTER DES COMMENTAIRES POUR DOCUMENTER
-- ===========================================
COMMENT ON COLUMN transactions_bancaires.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN transactions_bancaires.receipt_file_name IS 'Nom du fichier reçu original';

-- ===========================================
-- 5. CRÉER DES INDEX POUR OPTIMISER LES REQUÊTES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_receipt_url ON transactions_bancaires(receipt_url);
CREATE INDEX IF NOT EXISTS idx_transactions_bancaires_receipt_file_name ON transactions_bancaires(receipt_file_name);

-- ===========================================
-- 6. VÉRIFIER LA CONFIGURATION FINALE
-- ===========================================
SELECT 
  'Configuration finale' as info,
  COUNT(*) FILTER (WHERE column_name = 'receipt_url') as has_receipt_url,
  COUNT(*) FILTER (WHERE column_name = 'receipt_file_name') as has_receipt_file_name
FROM information_schema.columns 
WHERE table_name = 'transactions_bancaires';

-- ===========================================
-- 7. AFFICHER LES INDEX CRÉÉS
-- ===========================================
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename = 'transactions_bancaires'
  AND indexname LIKE '%receipt%'
ORDER BY indexname;

SELECT '✅ Script terminé avec succès!' as status;

