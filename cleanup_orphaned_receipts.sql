-- Script pour nettoyer les fichiers reçus orphelins
-- Ce script identifie et supprime les fichiers reçus qui ne sont plus référencés dans la base de données

-- 1. Vérifier les reçus orphelins dans les dépenses
SELECT 
  'depenses' as table_name,
  id,
  libelle,
  receipt_url,
  receipt_file_name,
  created_at
FROM depenses 
WHERE receipt_url IS NOT NULL 
  AND receipt_url != ''
  AND created_at < NOW() - INTERVAL '1 day'  -- Seulement les anciens pour éviter les faux positifs
ORDER BY created_at DESC;

-- 2. Vérifier les reçus orphelins dans les recettes
SELECT 
  'recettes' as table_name,
  id,
  libelle,
  receipt_url,
  receipt_file_name,
  created_at
FROM recettes 
WHERE receipt_url IS NOT NULL 
  AND receipt_url != ''
  AND created_at < NOW() - INTERVAL '1 day'  -- Seulement les anciens pour éviter les faux positifs
ORDER BY created_at DESC;

-- 3. Compter le nombre total de reçus
SELECT 
  'Total reçus dépenses' as type,
  COUNT(*) as count
FROM depenses 
WHERE receipt_url IS NOT NULL AND receipt_url != ''

UNION ALL

SELECT 
  'Total reçus recettes' as type,
  COUNT(*) as count
FROM recettes 
WHERE receipt_url IS NOT NULL AND receipt_url != '';

-- 4. Identifier les URLs de reçus uniques
SELECT DISTINCT receipt_url
FROM (
  SELECT receipt_url FROM depenses WHERE receipt_url IS NOT NULL AND receipt_url != ''
  UNION ALL
  SELECT receipt_url FROM recettes WHERE receipt_url IS NOT NULL AND receipt_url != ''
) as all_receipts
ORDER BY receipt_url;




















