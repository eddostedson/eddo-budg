-- Insérer des recettes de test pour l'utilisateur
-- Remplacez l'user_id par l'ID réel de l'utilisateur

INSERT INTO recettes (
    user_id,
    description,
    amount,
    solde_disponible,
    receipt_date,
    created_at,
    updated_at
) VALUES 
(
    '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19',
    'Salaire Octobre 2024',
    750000,
    750000,
    '2024-10-01',
    NOW(),
    NOW()
),
(
    '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19',
    'Prime Performance',
    150000,
    150000,
    '2024-10-15',
    NOW(),
    NOW()
),
(
    '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19',
    'Vente Produit',
    200000,
    200000,
    '2024-10-20',
    NOW(),
    NOW()
);

-- Vérifier l'insertion
SELECT 
    id,
    description,
    amount,
    solde_disponible,
    receipt_date
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY created_at DESC;



