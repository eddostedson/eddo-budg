-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 CORRECTION INTELLIGENTE FINALE - AVEC LIMITES DE MONTANT
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script lie les dépenses en respectant les limites de chaque recette
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔄 ÉTAPE 1 : RÉINITIALISER TOUTES LES LIAISONS
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE depenses 
SET recette_id = NULL;

SELECT '🔄 Toutes les liaisons ont été réinitialisées' as info;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 2 : LIAISON PAR MATCH EXACT UNIQUEMENT
-- ═══════════════════════════════════════════════════════════════════════════
-- On lie SEULEMENT les dépenses dont le montant correspond EXACTEMENT
-- au montant dépensé de la recette (amount - solde_disponible)
-- ═══════════════════════════════════════════════════════════════════════════

WITH matches_exacts AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        -- Une seule dépense par recette (match exact = 1 dépense)
        AND NOT EXISTS (
            SELECT 1 FROM depenses d2 
            WHERE d2.recette_id = r.id 
            AND d2.id != d.id
        )
    ORDER BY d.id, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = me.recette_id
FROM matches_exacts me
WHERE d.id = me.depense_id;

SELECT 
    '✅ ÉTAPE 2 - Match exact' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 3 : LIAISON PAR MOTS-CLÉS (AVEC LIMITE)
-- ═══════════════════════════════════════════════════════════════════════════
-- On lie par mots-clés MAIS en respectant la limite de montant
-- On prend les dépenses une par une jusqu'à atteindre le montant attendu
-- ═══════════════════════════════════════════════════════════════════════════

-- 3.1 - KENNEDY
WITH kennedy_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu,
        -- Calculer le total des dépenses déjà liées à cette recette
        COALESCE((
            SELECT SUM(d2.montant) 
            FROM depenses d2 
            WHERE d2.recette_id = r.id
        ), 0) as deja_lie
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%kennedy%' OR LOWER(d.description) LIKE '%kennedy%')
        AND LOWER(r.description) LIKE '%kennedy%'
        AND (r.amount - r.solde_disponible) > 0
        -- Vérifier qu'il reste de la place pour cette dépense
        AND d.montant <= (
            (r.amount - r.solde_disponible) - COALESCE((
                SELECT SUM(d2.montant) 
                FROM depenses d2 
                WHERE d2.recette_id = r.id
            ), 0)
        )
    ORDER BY d.id, d.date, d.montant DESC
)
UPDATE depenses d
SET recette_id = km.recette_id
FROM kennedy_matches km
WHERE d.id = km.depense_id;

-- 3.2 - PBF
WITH pbf_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%pbf%' OR LOWER(d.description) LIKE '%pbf%')
        AND LOWER(r.description) LIKE '%pbf%'
        AND (r.amount - r.solde_disponible) > 0
        AND d.montant <= (
            (r.amount - r.solde_disponible) - COALESCE((
                SELECT SUM(d2.montant) 
                FROM depenses d2 
                WHERE d2.recette_id = r.id
            ), 0)
        )
    ORDER BY d.id, d.date, d.montant DESC
)
UPDATE depenses d
SET recette_id = pm.recette_id
FROM pbf_matches pm
WHERE d.id = pm.depense_id;

-- 3.3 - EXPERTISE
WITH expertise_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%expertise%' OR LOWER(d.description) LIKE '%expertise%')
        AND LOWER(r.description) LIKE '%expertise%'
        AND (r.amount - r.solde_disponible) > 0
        AND d.montant <= (
            (r.amount - r.solde_disponible) - COALESCE((
                SELECT SUM(d2.montant) 
                FROM depenses d2 
                WHERE d2.recette_id = r.id
            ), 0)
        )
    ORDER BY d.id, d.date, d.montant DESC
)
UPDATE depenses d
SET recette_id = em.recette_id
FROM expertise_matches em
WHERE d.id = em.depense_id;

-- 3.4 - AHOKOKRO
WITH ahokokro_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%ahokokro%' OR LOWER(d.description) LIKE '%ahokokro%')
        AND LOWER(r.description) LIKE '%ahokokro%'
        AND (r.amount - r.solde_disponible) > 0
        AND d.montant <= (
            (r.amount - r.solde_disponible) - COALESCE((
                SELECT SUM(d2.montant) 
                FROM depenses d2 
                WHERE d2.recette_id = r.id
            ), 0)
        )
    ORDER BY d.id, d.date, d.montant DESC
)
UPDATE depenses d
SET recette_id = am.recette_id
FROM ahokokro_matches am
WHERE d.id = am.depense_id;

-- 3.5 - NUMERAIRE
WITH numeraire_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (LOWER(d.libelle) LIKE '%numeraire%' OR LOWER(r.description) LIKE '%numeraire%')
        AND LOWER(r.description) LIKE '%numeraire%'
        AND (r.amount - r.solde_disponible) > 0
        AND d.montant <= (
            (r.amount - r.solde_disponible) - COALESCE((
                SELECT SUM(d2.montant) 
                FROM depenses d2 
                WHERE d2.recette_id = r.id
            ), 0)
        )
    ORDER BY d.id, d.date, d.montant DESC
)
UPDATE depenses d
SET recette_id = nm.recette_id
FROM numeraire_matches nm
WHERE d.id = nm.depense_id;

SELECT 
    '✅ ÉTAPE 3 - Mots-clés' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

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

SELECT '📋 VÉRIFICATION PAR RECETTE' as section;

SELECT 
    r.description as recette,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COUNT(d.id) as nb_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as ecart,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1 THEN '✅ PARFAIT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 AND (r.amount - r.solde_disponible) = 0 THEN '✅ AUCUNE DÉPENSE'
        WHEN COALESCE(SUM(d.montant), 0) = 0 THEN '⚠️ AUCUNE LIAISON'
        WHEN COALESCE(SUM(d.montant), 0) > (r.amount - r.solde_disponible) THEN '❌ TROP DE DÉPENSES!'
        ELSE '⚠️ ÉCART: ' || ROUND(ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)), 2) || ' F'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.receipt_date DESC;


