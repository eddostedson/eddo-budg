-- Configuration du stockage des reçus dans Supabase
-- À exécuter dans Supabase SQL Editor

-- 1. Créer le bucket pour les reçus
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Créer une politique RLS pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Créer une politique RLS pour permettre la lecture des reçus
CREATE POLICY "Users can view receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Créer une politique RLS pour permettre la suppression des reçus
CREATE POLICY "Users can delete receipts" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Créer une politique RLS pour permettre la mise à jour des reçus
CREATE POLICY "Users can update receipts" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Ajouter les colonnes receipt_url et receipt_file_name à la table depenses
ALTER TABLE depenses 
ADD COLUMN IF NOT EXISTS receipt_url TEXT,
ADD COLUMN IF NOT EXISTS receipt_file_name TEXT;

-- 7. Créer un index sur les nouvelles colonnes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_depenses_receipt_url ON depenses(receipt_url);
CREATE INDEX IF NOT EXISTS idx_depenses_receipt_file_name ON depenses(receipt_file_name);

-- 8. Ajouter des commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN depenses.receipt_url IS 'URL du reçu uploadé dans Supabase Storage';
COMMENT ON COLUMN depenses.receipt_file_name IS 'Nom du fichier reçu original';





















