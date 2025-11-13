-- Script pour lier toutes les dépenses aux recettes correspondantes
-- Basé sur la correspondance des montants

-- 1. D'abord, voir toutes les recettes avec leurs soldes
SELECT 
    'RECETTES' as type,
    id,
    description,
    amount,
    solde_disponible,
    (amount - solde_disponible) as depense_attendue
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY amount DESC;

-- 2. Voir toutes les dépenses non liées
SELECT 
    'DEPENSES NON LIEES' as type,
    id,
    libelle,
    montant,
    recette_id,
    created_at
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
AND recette_id IS NULL
ORDER BY montant DESC;


