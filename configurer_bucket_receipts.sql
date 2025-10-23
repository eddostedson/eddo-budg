-- 🛠️ CONFIGURER LE BUCKET 'receipts' POUR LES REÇUS
-- À exécuter dans Supabase SQL Editor

-- 1. CRÉER LE BUCKET 'receipts' S'IL N'EXISTE PAS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'receipts',
    'receipts', 
    true,  -- Public pour accès direct
    5242880,  -- 5MB en bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. CRÉER LA POLITIQUE RLS POUR L'UPLOAD (authentifiés seulement)
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
);

-- 3. CRÉER LA POLITIQUE RLS POUR LA LECTURE (public)
CREATE POLICY "Anyone can view receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- 4. CRÉER LA POLITIQUE RLS POUR LA SUPPRESSION (propriétaire seulement)
CREATE POLICY "Users can delete their own receipts" ON storage.objects
FOR DELETE USING (
    bucket_id = 'receipts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. VÉRIFIER LA CONFIGURATION
SELECT 
    'CONFIGURATION FINALE' as info,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'receipts';
