-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 CORRECTION INTELLIGENTE DES LIAISONS DÉPENSES-RECETTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script lie automatiquement les dépenses aux bonnes recettes
-- en utilisant plusieurs stratégies de matching intelligentes
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️ ÉTAPE 0 : RÉINITIALISER TOUTES LES LIAISONS (SÉCURISÉ)
-- ═══════════════════════════════════════════════════════════════════════════
UPDATE depenses 
SET recette_id = NULL 
WHERE recette_id IS NOT NULL;

SELECT 'Toutes les liaisons ont été réinitialisées' as etape_0;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 STRATÉGIE 1 : LIAISON PAR MATCH EXACT DE MONTANT
-- ═══════════════════════════════════════════════════════════════════════════
-- Lie les dépenses dont le montant correspond EXACTEMENT au montant dépensé
-- de la recette (montant_recette - solde_disponible)
-- ═══════════════════════════════════════════════════════════════════════════

WITH matches_exacts AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle as depense,
        d.montant as montant_depense,
        r.description as recette,
        (r.amount - r.solde_disponible) as montant_attendu
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = me.recette_id
FROM matches_exacts me
WHERE d.id = me.depense_id;

SELECT 
    'STRATÉGIE 1 - MATCH EXACT' as strategie,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 STRATÉGIE 2 : LIAISON PAR MOTS-CLÉS (Kennedy, Ahokokro, etc.)
-- ═══════════════════════════════════════════════════════════════════════════
-- Lie les dépenses qui contiennent des mots-clés spécifiques aux recettes
-- correspondantes
-- ═══════════════════════════════════════════════════════════════════════════

-- 2.1 - KENNEDY
WITH kennedy_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        r.description
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (
            LOWER(d.libelle) LIKE '%kennedy%' 
            OR LOWER(d.description) LIKE '%kennedy%'
        )
        AND LOWER(r.description) LIKE '%kennedy%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = km.recette_id
FROM kennedy_matches km
WHERE d.id = km.depense_id;

-- 2.2 - AHOKOKRO
WITH ahokokro_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        r.description
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (
            LOWER(d.libelle) LIKE '%ahokokro%' 
            OR LOWER(d.description) LIKE '%ahokokro%'
        )
        AND LOWER(r.description) LIKE '%ahokokro%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = am.recette_id
FROM ahokokro_matches am
WHERE d.id = am.depense_id;

-- 2.3 - N'DOUMI
WITH ndoumi_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        r.description
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (
            LOWER(d.libelle) LIKE '%n''doumi%' 
            OR LOWER(d.libelle) LIKE '%ndoumi%'
            OR LOWER(d.description) LIKE '%n''doumi%'
            OR LOWER(d.description) LIKE '%ndoumi%'
        )
        AND (
            LOWER(r.description) LIKE '%n''doumi%'
            OR LOWER(r.description) LIKE '%ndoumi%'
        )
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = nm.recette_id
FROM ndoumi_matches nm
WHERE d.id = nm.depense_id;

SELECT 
    'STRATÉGIE 2 - MOTS-CLÉS' as strategie,
    COUNT(*) as nb_liaisons_totales
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 STRATÉGIE 3 : LIAISON PAR PROXIMITÉ DE DATE ET MONTANT
-- ═══════════════════════════════════════════════════════════════════════════
-- Lie les dépenses restantes en fonction de la proximité de date et montant
-- ═══════════════════════════════════════════════════════════════════════════

WITH date_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu,
        ABS(EXTRACT(EPOCH FROM (d.date - r.receipt_date))) as ecart_secondes
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        AND ABS(EXTRACT(EPOCH FROM (d.date - r.receipt_date))) < 7776000  -- 90 jours
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        ABS(EXTRACT(EPOCH FROM (d.date - r.receipt_date)))
)
UPDATE depenses d
SET recette_id = dm.recette_id
FROM date_matches dm
WHERE d.id = dm.depense_id;

SELECT 
    'STRATÉGIE 3 - PROXIMITÉ' as strategie,
    COUNT(*) as nb_liaisons_totales
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RAPPORT FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '══════════════════════════════════════' as separateur,
    '✅ CORRECTION TERMINÉE - RAPPORT FINAL' as titre;

SELECT 
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) as pourcentage_liees
FROM depenses;

-- Vérification de cohérence des recettes
SELECT 
    r.description as recette,
    r.amount as montant_recette,
    r.solde_disponible as solde_disponible,
    (r.amount - r.solde_disponible) as total_depenses_attendu,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    COUNT(d.id) as nb_depenses_liees,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1 
        THEN '✅ CORRECT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 AND (r.amount - r.solde_disponible) = 0
        THEN '✅ AUCUNE DÉPENSE'
        ELSE '⚠️ À VÉRIFIER'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY 
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) >= 1 THEN 0
        ELSE 1
    END,
    r.receipt_date DESC;


