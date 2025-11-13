-- Vérifier quelques dépenses pour voir leur structure
SELECT 
    id,
    user_id,
    libelle,
    montant,
    date,
    description,
    categorie,
    recette_id,
    created_at
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY created_at DESC
LIMIT 5;


