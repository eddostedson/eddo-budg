-- ═══════════════════════════════════════════════════════════════════════════
-- 🧮 LIAISON MATHÉMATIQUE INTELLIGENTE DES DÉPENSES AUX RECETTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Approche : Pour chaque recette, trouver les dépenses dont la somme
-- correspond EXACTEMENT au montant attendu (montant - solde = 0)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔄 ÉTAPE 1 : RÉINITIALISER TOUTES LES LIAISONS
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE depenses SET recette_id = NULL;

SELECT '🔄 Liaisons réinitialisées' as etape;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 2 : LIER LES DÉPENSES UNIQUES (1 dépense = montant exact)
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_unique AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        r.description as recette,
        d.libelle as depense,
        d.montant
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = mu.recette_id
FROM match_unique mu
WHERE d.id = mu.depense_id;

SELECT 
    '✅ ÉTAPE 2 - Correspondances uniques' as etape,
    COUNT(*) as nb_liaisons
FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 3 : LIER 2 DÉPENSES qui totalisent le montant exact
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_double AS (
    SELECT DISTINCT ON (d1.id, d2.id)
        d1.id as depense1_id,
        d2.id as depense2_id,
        r.id as recette_id,
        r.description as recette,
        (d1.montant + d2.montant) as total,
        (r.amount - r.solde_disponible) as attendu
    FROM depenses d1
    CROSS JOIN depenses d2
    CROSS JOIN recettes r
    WHERE d1.recette_id IS NULL
        AND d2.recette_id IS NULL
        AND d1.id < d2.id  -- Éviter les doublons
        AND (d1.montant + d2.montant) = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        -- Vérifier qu'aucune autre dépense n'est liée à cette recette
        AND NOT EXISTS (
            SELECT 1 FROM depenses dx 
            WHERE dx.recette_id = r.id
        )
    ORDER BY d1.id, d2.id, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = (
    SELECT recette_id FROM match_double 
    WHERE d.id IN (depense1_id, depense2_id)
    LIMIT 1
)
WHERE d.id IN (
    SELECT depense1_id FROM match_double
    UNION
    SELECT depense2_id FROM match_double
);

SELECT 
    '✅ ÉTAPE 3 - Combinaisons de 2 dépenses' as etape,
    COUNT(*) as nb_liaisons_totales
FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 4 : LIER 3 DÉPENSES qui totalisent le montant exact
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_triple AS (
    SELECT DISTINCT ON (d1.id, d2.id, d3.id)
        d1.id as depense1_id,
        d2.id as depense2_id,
        d3.id as depense3_id,
        r.id as recette_id,
        r.description as recette,
        (d1.montant + d2.montant + d3.montant) as total
    FROM depenses d1
    CROSS JOIN depenses d2
    CROSS JOIN depenses d3
    CROSS JOIN recettes r
    WHERE d1.recette_id IS NULL
        AND d2.recette_id IS NULL
        AND d3.recette_id IS NULL
        AND d1.id < d2.id 
        AND d2.id < d3.id
        AND (d1.montant + d2.montant + d3.montant) = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        AND NOT EXISTS (
            SELECT 1 FROM depenses dx 
            WHERE dx.recette_id = r.id
        )
    ORDER BY d1.id, d2.id, d3.id, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = (
    SELECT recette_id FROM match_triple 
    WHERE d.id IN (depense1_id, depense2_id, depense3_id)
    LIMIT 1
)
WHERE d.id IN (
    SELECT depense1_id FROM match_triple
    UNION
    SELECT depense2_id FROM match_triple
    UNION
    SELECT depense3_id FROM match_triple
);

SELECT 
    '✅ ÉTAPE 4 - Combinaisons de 3 dépenses' as etape,
    COUNT(*) as nb_liaisons_totales
FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 5 : LIER PAR MOTS-CLÉS pour les cas restants
-- ═══════════════════════════════════════════════════════════════════════════

-- Kennedy
WITH kennedy_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%kennedy%' OR LOWER(d.description) LIKE '%kennedy%')
        AND LOWER(r.description) LIKE '%kennedy%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, ABS((r.amount - r.solde_disponible) - d.montant), r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = km.recette_id
FROM kennedy_matches km
WHERE d.id = km.depense_id;

-- PBF
WITH pbf_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%pbf%' OR LOWER(d.description) LIKE '%pbf%')
        AND LOWER(r.description) LIKE '%pbf%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, ABS((r.amount - r.solde_disponible) - d.montant), r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = pm.recette_id
FROM pbf_matches pm
WHERE d.id = pm.depense_id;

SELECT 
    '✅ ÉTAPE 5 - Mots-clés' as etape,
    COUNT(*) as nb_liaisons_totales
FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RAPPORT FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;

SELECT 
    '📊 STATISTIQUES FINALES' as section,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) || '%' as taux_liaison
FROM depenses;

SELECT '══════════════════════════════════════' as separateur;

SELECT '📋 VÉRIFICATION PAR RECETTE (ÉCART = 0 UNIQUEMENT)' as section;

SELECT 
    r.description as recette,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COUNT(d.id) as nb_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as ecart,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 0.01 THEN '✅ PARFAIT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 AND (r.amount - r.solde_disponible) = 0 THEN '✅ AUCUNE DÉPENSE'
        WHEN COALESCE(SUM(d.montant), 0) = 0 THEN '⚠️ AUCUNE LIAISON'
        WHEN COALESCE(SUM(d.montant), 0) > (r.amount - r.solde_disponible) THEN '❌ TROP'
        ELSE '⚠️ ÉCART: ' || ROUND(ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)), 2) || ' F'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY 
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 0.01 THEN 0
        ELSE 1
    END,
    r.receipt_date DESC;


