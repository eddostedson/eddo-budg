-- Analyser les possibilités de correspondance entre recettes et dépenses
-- Pour identifier les meilleures liaisons possibles

WITH recettes_avec_depenses AS (
    SELECT 
        id,
        description,
        amount,
        solde_disponible,
        (amount - solde_disponible) as depense_attendue
    FROM recettes 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND amount > solde_disponible
),
depenses_non_liees AS (
    SELECT 
        id,
        libelle,
        montant,
        created_at
    FROM depenses 
    WHERE user_id = '4c36ff7e-0d1d-4bee-b096-b8cd9e1f7e19'
    AND recette_id IS NULL
),
correspondances AS (
    SELECT 
        r.id as recette_id,
        r.description as recette_description,
        r.depense_attendue,
        d.id as depense_id,
        d.libelle as depense_libelle,
        d.montant as depense_montant,
        ABS(d.montant - r.depense_attendue) as difference
    FROM recettes_avec_depenses r
    CROSS JOIN depenses_non_liees d
    WHERE ABS(d.montant - r.depense_attendue) < 1000 -- Tolérance de 1000 F CFA
),
meilleures_correspondances AS (
    SELECT 
        recette_id,
        recette_description,
        depense_attendue,
        depense_id,
        depense_libelle,
        depense_montant,
        difference,
        ROW_NUMBER() OVER (PARTITION BY depense_id ORDER BY difference ASC) as rn
    FROM correspondances
)
SELECT 
    'MEILLEURES CORRESPONDANCES' as type,
    recette_description,
    depense_attendue,
    depense_libelle,
    depense_montant,
    difference,
    CASE 
        WHEN difference < 0.01 THEN 'CORRESPONDANCE EXACTE'
        WHEN difference < 100 THEN 'CORRESPONDANCE BONNE'
        ELSE 'CORRESPONDANCE APPROCHÉE'
    END as qualite
FROM meilleures_correspondances
WHERE rn = 1
ORDER BY difference ASC
LIMIT 20;


