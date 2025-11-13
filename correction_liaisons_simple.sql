-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 CORRECTION SIMPLE DES LIAISONS DÉPENSES-RECETTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Version simplifiée sans calculs de date complexes
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 ÉTAPE 1 : DIAGNOSTIC AVANT CORRECTION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '📊 ÉTAT AVANT CORRECTION' as titre,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) as pourcentage_liees
FROM depenses;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 ÉTAPE 2 : RÉINITIALISER TOUTES LES LIAISONS
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE depenses 
SET recette_id = NULL 
WHERE recette_id IS NOT NULL;

SELECT '🔄 Toutes les liaisons ont été réinitialisées' as info;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 3 : LIAISON PAR MATCH EXACT
-- ═══════════════════════════════════════════════════════════════════════════

WITH matches_exacts AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
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
    '✅ ÉTAPE 3 - Match exact' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 4 : LIAISON KENNEDY
-- ═══════════════════════════════════════════════════════════════════════════

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
        AND (r.amount - r.solde_disponible) - COALESCE((
            SELECT SUM(montant) FROM depenses 
            WHERE recette_id = r.id AND id != d.id
        ), 0) >= d.montant
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = km.recette_id
FROM kennedy_matches km
WHERE d.id = km.depense_id;

SELECT 
    '✅ ÉTAPE 4 - Kennedy' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 5 : LIAISON SALAIRE
-- ═══════════════════════════════════════════════════════════════════════════

WITH salaire_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND LOWER(r.description) LIKE '%salaire%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        AND (r.amount - r.solde_disponible) - COALESCE((
            SELECT SUM(montant) FROM depenses 
            WHERE recette_id = r.id AND id != d.id
        ), 0) >= d.montant
    ORDER BY d.id, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = sm.recette_id
FROM salaire_matches sm
WHERE d.id = sm.depense_id;

SELECT 
    '✅ ÉTAPE 5 - Salaire' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 6 : LIAISON PBF / EXPERTISE / AUTRES
-- ═══════════════════════════════════════════════════════════════════════════

WITH autres_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (
            (LOWER(d.libelle) LIKE '%pbf%' AND LOWER(r.description) LIKE '%pbf%')
            OR (LOWER(d.libelle) LIKE '%expertise%' AND LOWER(r.description) LIKE '%expertise%')
            OR (LOWER(d.libelle) LIKE '%numeraire%' AND LOWER(r.description) LIKE '%numeraire%')
            OR (LOWER(d.libelle) LIKE '%ahokokro%' AND LOWER(r.description) LIKE '%ahokokro%')
            OR (LOWER(d.libelle) LIKE '%kongodjan%' AND LOWER(r.description) LIKE '%kongodjan%')
            OR (LOWER(d.libelle) LIKE '%n''doumi%' AND LOWER(r.description) LIKE '%n''doumi%')
            OR (LOWER(d.libelle) LIKE '%reversement%' AND LOWER(r.description) LIKE '%reversement%')
            OR (LOWER(d.libelle) LIKE '%reliquat%' AND LOWER(r.description) LIKE '%reliquat%')
        )
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        AND (r.amount - r.solde_disponible) - COALESCE((
            SELECT SUM(montant) FROM depenses 
            WHERE recette_id = r.id AND id != d.id
        ), 0) >= d.montant
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = am.recette_id
FROM autres_matches am
WHERE d.id = am.depense_id;

SELECT 
    '✅ ÉTAPE 6 - Autres mots-clés' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 7 : LIAISON PAR MONTANT PROCHE (dernière tentative)
-- ═══════════════════════════════════════════════════════════════════════════

WITH montant_proche AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        AND (r.amount - r.solde_disponible) - COALESCE((
            SELECT SUM(montant) FROM depenses 
            WHERE recette_id = r.id AND id != d.id
        ), 0) >= d.montant
    ORDER BY d.id, 
        ABS((r.amount - r.solde_disponible) - d.montant),
        r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = mp.recette_id
FROM montant_proche mp
WHERE d.id = mp.depense_id;

SELECT 
    '✅ ÉTAPE 7 - Montant proche' as etape,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RAPPORT FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '══════════════════════════════════════' as separateur;

SELECT 
    '✅ CORRECTION TERMINÉE' as titre;

SELECT 
    '📊 STATISTIQUES FINALES' as section,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) || '%' as taux_liaison,
    SUM(montant) as montant_total_depenses,
    SUM(CASE WHEN recette_id IS NOT NULL THEN montant ELSE 0 END) as montant_depenses_liees
FROM depenses;

SELECT 
    '══════════════════════════════════════' as separateur;

SELECT 
    '📋 VÉRIFICATION PAR RECETTE' as section;

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
        ELSE '⚠️ ÉCART: ' || ROUND((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0), 2) || ' F'
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

SELECT 
    '══════════════════════════════════════' as separateur;

SELECT 
    '❌ DÉPENSES TOUJOURS NON LIÉES (TOP 20)' as section;

SELECT 
    libelle,
    montant,
    date,
    description
FROM depenses
WHERE recette_id IS NULL
ORDER BY montant DESC
LIMIT 20;


