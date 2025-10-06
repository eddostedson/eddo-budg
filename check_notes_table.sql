-- Vérifier si la table notes existe et sa structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'notes' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

