-- Vérifier les dépenses avec leur recette_id
SELECT 
    id,
    libelle,
    montant,
    date,
    recette_id,
    created_at
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY created_at DESC
LIMIT 10;


