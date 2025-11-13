-- Vérifier la structure de la table recettes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes' 
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT COUNT(*) as total_recettes FROM recettes;

-- Vérifier les colonnes spécifiques
SELECT 
    id,
    user_id,
    description,
    amount,
    solde_disponible,
    receipt_date,
    created_at
FROM recettes 
LIMIT 5;

-- Vérifier les contraintes RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'recettes';



