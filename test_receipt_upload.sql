-- Script de test pour vérifier la configuration des reçus
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si le bucket 'receipts' existe
SELECT * FROM storage.buckets WHERE id = 'receipts';

-- 2. Vérifier les politiques RLS sur storage.objects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%receipt%';

-- 3. Vérifier si les colonnes receipt_url et receipt_file_name existent
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND column_name IN ('receipt_url', 'receipt_file_name');

-- 4. Tester la création d'un bucket si nécessaire
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Créer les politiques RLS si elles n'existent pas
DO $$
BEGIN
    -- Politique pour l'upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can upload receipts'
    ) THEN
        CREATE POLICY "Users can upload receipts" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Politique pour la lecture
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can view receipts'
    ) THEN
        CREATE POLICY "Users can view receipts" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    -- Politique pour la suppression
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can delete receipts'
    ) THEN
        CREATE POLICY "Users can delete receipts" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- 6. Vérifier que tout est configuré correctement
SELECT 'Configuration des reçus terminée' as status;







