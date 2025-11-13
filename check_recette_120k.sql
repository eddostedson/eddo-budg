-- Vérifier la recette de 120 000 F CFA
SELECT 
    id,
    description,
    amount,
    solde_disponible,
    created_at
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND amount = 120000
ORDER BY created_at DESC;


