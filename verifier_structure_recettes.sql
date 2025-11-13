-- 🔍 VÉRIFIER LA STRUCTURE DE LA TABLE RECETTES
-- Exécutez cette requête dans Supabase SQL Editor

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

