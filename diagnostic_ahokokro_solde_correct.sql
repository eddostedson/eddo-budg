-- 🔍 DIAGNOSTIC SOLDE PBF AHOKOKRO
-- Vérifier le solde réel en base de données

-- 1. Informations de la recette PBF Ahokokro
SELECT 
    'INFORMATIONS RECETTE' as info,
    id,
    libelle,
    amount as montant_initial,
    solde_disponible as solde_actuel,
    created_at,
    updated_at
FROM recettes 
WHERE libelle LIKE '%PBF Ahokokro%'
ORDER BY created_at DESC;

-- 2. Dépenses liées à PBF Ahokokro
SELECT 
    'DÉPENSES LIÉES' as info,
    d.id,
    d.libelle,
    d.montant,
    d.date,
    d.description
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.libelle LIKE '%PBF Ahokokro%'
ORDER BY d.created_at DESC;

-- 3. Calcul du solde correct
SELECT 
    'CALCUL SOLDE CORRECT' as info,
    r.libelle,
    r.amount as montant_initial,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct,
    r.solde_disponible as solde_actuel,
    (r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE r.libelle LIKE '%PBF Ahokokro%'
GROUP BY r.id, r.libelle, r.amount, r.solde_disponible;

-- 4. Vérification des dernières dépenses
SELECT 
    'DERNIÈRES DÉPENSES' as info,
    d.libelle,
    d.montant,
    d.date,
    d.created_at
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.libelle LIKE '%PBF Ahokokro%'
ORDER BY d.created_at DESC
LIMIT 5;
