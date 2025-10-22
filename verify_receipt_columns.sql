-- Script de vérification des colonnes de reçus
-- Exécuter après avoir ajouté les colonnes pour vérifier que tout est en place

-- 1. Vérifier les colonnes dans la table depenses
SELECT 
  'depenses' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
  AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY column_name;

-- 2. Vérifier les colonnes dans la table recettes
SELECT 
  'recettes' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'recettes' 
  AND column_name IN ('receipt_url', 'receipt_file_name')
ORDER BY column_name;

-- 3. Compter les enregistrements avec des reçus
SELECT 
  'Dépenses avec reçus' as type,
  COUNT(*) as count
FROM depenses 
WHERE receipt_url IS NOT NULL AND receipt_url != ''

UNION ALL

SELECT 
  'Recettes avec reçus' as type,
  COUNT(*) as count
FROM recettes 
WHERE receipt_url IS NOT NULL AND receipt_url != '';

-- 4. Lister quelques exemples de reçus existants (si il y en a)
SELECT 
  'Exemples de reçus dans depenses' as info,
  id,
  libelle,
  receipt_url,
  receipt_file_name
FROM depenses 
WHERE receipt_url IS NOT NULL AND receipt_url != ''
LIMIT 5;

SELECT 
  'Exemples de reçus dans recettes' as info,
  id,
  libelle,
  receipt_url,
  receipt_file_name
FROM recettes 
WHERE receipt_url IS NOT NULL AND receipt_url != ''
LIMIT 5;

-- 5. Vérifier les index créés
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('depenses', 'recettes')
  AND indexname LIKE '%receipt%'
ORDER BY tablename, indexname;













