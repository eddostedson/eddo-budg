-- Script complet pour ajouter les colonnes de reçus aux tables depenses et recettes
-- Exécuter dans l'éditeur SQL de Supabase

-- ===========================================
-- 1. AJOUT DES COLONNES À LA TABLE DEPENSES
-- ===========================================

-- Vérifier la structure actuelle de la table depenses
SELECT 'Structure actuelle de la table depenses:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
ORDER BY ordinal_position;

-- Ajouter les colonnes manquantes pour les reçus dans depenses
ALTER TABLE depenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- Vérifier que les colonnes ont été ajoutées à depenses
SELECT 'Colonnes ajoutées à depenses:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

-- Ajouter des commentaires pour documenter les nouvelles colonnes dans depenses
COMMENT ON COLUMN depenses.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN depenses.receipt_file_name IS 'Nom du fichier reçu original';

-- Créer des index pour optimiser les requêtes dans depenses
CREATE INDEX IF NOT EXISTS idx_depenses_receipt_url ON depenses(receipt_url);
CREATE INDEX IF NOT EXISTS idx_depenses_receipt_file_name ON depenses(receipt_file_name);

-- ===========================================
-- 2. AJOUT DES COLONNES À LA TABLE RECETTES
-- ===========================================

-- Vérifier la structure actuelle de la table recettes
SELECT 'Structure actuelle de la table recettes:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes' 
ORDER BY ordinal_position;

-- Ajouter les colonnes pour les reçus dans recettes
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- Vérifier que les colonnes ont été ajoutées à recettes
SELECT 'Colonnes ajoutées à recettes:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

-- Ajouter des commentaires pour documenter les nouvelles colonnes dans recettes
COMMENT ON COLUMN recettes.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN recettes.receipt_file_name IS 'Nom du fichier reçu original';

-- Créer des index pour optimiser les requêtes dans recettes
CREATE INDEX IF NOT EXISTS idx_recettes_receipt_url ON recettes(receipt_url);
CREATE INDEX IF NOT EXISTS idx_recettes_receipt_file_name ON recettes(receipt_file_name);

-- ===========================================
-- 3. VÉRIFICATION FINALE
-- ===========================================

-- Vérifier que toutes les colonnes existent maintenant
SELECT 'Vérification finale - Colonnes de reçus dans depenses:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

SELECT 'Vérification finale - Colonnes de reçus dans recettes:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

-- Message de succès
SELECT '✅ Configuration des colonnes de reçus terminée avec succès !' as status;




















