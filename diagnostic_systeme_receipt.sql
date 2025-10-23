-- 🔍 DIAGNOSTIC DU SYSTÈME DE REÇU
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER L'EXISTENCE DU BUCKET 'receipts'
SELECT 
    'BUCKETS DISPONIBLES' as info,
    name,
    id,
    created_at
FROM storage.buckets;

-- 2. VÉRIFIER LES POLITIQUES RLS POUR LE BUCKET 'receipts'
SELECT 
    'POLITIQUES RLS RECEIPTS' as info,
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
AND schemaname = 'storage';

-- 3. VÉRIFIER LES PERMISSIONS SUR LE BUCKET
SELECT 
    'PERMISSIONS BUCKET' as info,
    bucket_id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'receipts';

-- 4. VÉRIFIER LES FICHIERS EXISTANTS DANS LE BUCKET
SELECT 
    'FICHIERS EXISTANTS' as info,
    name,
    bucket_id,
    owner,
    created_at,
    updated_at,
    last_accessed_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'receipts'
ORDER BY created_at DESC
LIMIT 10;
