-- Vérifier les recettes de l'utilisateur spécifique
-- Remplacez '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19' par l'ID de l'utilisateur

-- 1. Vérifier si l'utilisateur existe
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19';

-- 2. Vérifier les recettes de cet utilisateur
SELECT 
    id,
    user_id,
    description,
    amount,
    solde_disponible,
    receipt_date,
    created_at
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY created_at DESC;

-- 3. Compter les recettes par utilisateur
SELECT 
    user_id,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_amount,
    SUM(solde_disponible) as total_solde
FROM recettes 
GROUP BY user_id
ORDER BY nombre_recettes DESC;

-- 4. Vérifier les permissions RLS
SELECT 
    has_table_privilege('4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19', 'recettes', 'SELECT') as can_select,
    has_table_privilege('4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19', 'recettes', 'INSERT') as can_insert,
    has_table_privilege('4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19', 'recettes', 'UPDATE') as can_update,
    has_table_privilege('4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19', 'recettes', 'DELETE') as can_delete;



