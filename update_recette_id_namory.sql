-- Mettre à jour la dépense "Namory" avec le bon recette_id
UPDATE depenses 
SET recette_id = 'acc36113-80f6-4a6d-89f6-b3d46cfef4a1'
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND libelle = 'Namory'
AND montant = 30000.00;

-- Vérifier la mise à jour
SELECT 
    id,
    libelle,
    montant,
    recette_id,
    created_at
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND libelle = 'Namory';


