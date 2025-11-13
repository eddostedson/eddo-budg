-- Script d'extraction complète des données depuis Supabase
-- Pour permettre de reprendre les saisies et lier correctement

-- 1. EXTRACTION DES RECETTES
SELECT 
    'RECETTES' as type_donnee,
    id,
    description,
    amount as montant,
    solde_disponible,
    (amount - solde_disponible) as depense_attendue,
    receipt_date as date_recette,
    created_at,
    updated_at
FROM recettes 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY amount DESC;

-- 2. EXTRACTION DES DÉPENSES
SELECT 
    'DEPENSES' as type_donnee,
    id,
    libelle,
    montant,
    date,
    recette_id,
    created_at,
    updated_at
FROM depenses 
WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY montant DESC;

-- 3. EXTRACTION DES LIAISONS ACTUELLES
SELECT 
    'LIAISONS_ACTUELLES' as type_donnee,
    r.description as recette_description,
    r.amount as montant_recette,
    r.solde_disponible,
    d.libelle as depense_libelle,
    d.montant as montant_depense,
    d.recette_id,
    d.id as depense_id
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id AND d.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
WHERE r.user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
ORDER BY r.amount DESC, d.montant DESC;


