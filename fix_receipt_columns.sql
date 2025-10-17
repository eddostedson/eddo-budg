-- Script pour ajouter les colonnes manquantes pour les reçus
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle de la table depenses
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes manquantes pour les reçus
ALTER TABLE depenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- 3. Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

-- 4. Ajouter des commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN depenses.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN depenses.receipt_file_name IS 'Nom du fichier reçu original';

-- 5. Créer des index pour optimiser les requêtes (optionnel)
CREATE INDEX IF NOT EXISTS idx_depenses_receipt_url ON depenses(receipt_url);
CREATE INDEX IF NOT EXISTS idx_depenses_receipt_file_name ON depenses(receipt_file_name);

-- 6. Vérifier que tout est configuré correctement
SELECT 'Colonnes pour les reçus ajoutées avec succès' as status;







