-- Script pour ajouter les colonnes de reçus à la table recettes
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle de la table recettes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes' 
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes pour les reçus
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- 3. Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes' 
AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY ordinal_position;

-- 4. Ajouter des commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN recettes.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN recettes.receipt_file_name IS 'Nom du fichier reçu original';

-- 5. Créer des index pour optimiser les requêtes (optionnel)
CREATE INDEX IF NOT EXISTS idx_recettes_receipt_url ON recettes(receipt_url);
CREATE INDEX IF NOT EXISTS idx_recettes_receipt_file_name ON recettes(receipt_file_name);

-- 6. Vérifier que tout est configuré correctement
SELECT 'Colonnes pour les reçus ajoutées avec succès à la table recettes' as status;

















