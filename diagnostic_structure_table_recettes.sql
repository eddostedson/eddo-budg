-- 🔍 DIAGNOSTIC DE LA STRUCTURE DE LA TABLE RECETTES
-- Vérifier les colonnes exactes de la table recettes

-- 1. Vérifier la structure de la table recettes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les premières lignes de la table recettes
SELECT * FROM recettes LIMIT 3;

-- 3. Vérifier la structure de la table depenses
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Vérifier les premières lignes de la table depenses
SELECT * FROM depenses LIMIT 3;
