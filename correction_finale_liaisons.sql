-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 CORRECTION FINALE DES LIAISONS DÉPENSES-RECETTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Script adapté à votre situation spécifique
-- Corrige les liaisons incomplètes et crée les liaisons manquantes
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
-- 🔧 ÉTAPE 2 : RÉINITIALISER LES LIAISONS INCORRECTES
-- ═══════════════════════════════════════════════════════════════════════════
-- On garde seulement les liaisons qui sont mathématiquement correctes
-- ═══════════════════════════════════════════════════════════════════════════

-- Identifier et supprimer les liaisons incorrectes
WITH liaisons_incorrectes AS (
    SELECT 
        d.id as depense_id,
        d.libelle,
        d.montant as montant_depense,
        d.recette_id,
        r.description as recette,
        r.amount as montant_recette,
        r.solde_disponible,
        (r.amount - r.solde_disponible) as depenses_attendues
    FROM depenses d
    JOIN recettes r ON d.recette_id = r.id
    WHERE d.montant > (r.amount - r.solde_disponible)  -- Dépense > montant attendu
)
UPDATE depenses d
SET recette_id = NULL
FROM liaisons_incorrectes li
WHERE d.id = li.depense_id;

SELECT 
    '🔧 Liaisons incorrectes supprimées' as etape,
    COUNT(*) as nb_corrections
FROM depenses
WHERE recette_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 3 : LIAISON PAR MATCH EXACT (PRIORITÉ 1)
-- ═══════════════════════════════════════════════════════════════════════════
-- Lie les dépenses dont le montant correspond EXACTEMENT au montant dépensé
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
        -- S'assurer qu'une autre dépense n'est pas déjà liée
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
    '✅ STRATÉGIE 1 - Match exact' as strategie,
    COUNT(*) as nb_liaisons
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 4 : LIAISON PAR MOTS-CLÉS (PRIORITÉ 2)
-- ═══════════════════════════════════════════════════════════════════════════

-- 4.1 - KENNEDY (Loyers)
WITH kennedy_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu,
        ABS((r.amount - r.solde_disponible) - d.montant) as ecart
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
        -- S'assurer qu'il reste de la place pour cette dépense
        AND (r.amount - r.solde_disponible) - COALESCE((
            SELECT SUM(montant) FROM depenses 
            WHERE recette_id = r.id AND id != d.id
        ), 0) >= d.montant
    ORDER BY d.id, ecart, r.receipt_date DESC
)
UPDATE depenses d
SET recette_id = km.recette_id
FROM kennedy_matches km
WHERE d.id = km.depense_id;

-- 4.2 - SALAIRE (Septembre, Octobre, etc.)
WITH salaire_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description,
        TO_CHAR(r.receipt_date, 'YYYY-MM') as mois_recette,
        TO_CHAR(d.date, 'YYYY-MM') as mois_depense
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND LOWER(r.description) LIKE '%salaire%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        -- Même mois ou mois suivant
        AND (
            TO_CHAR(r.receipt_date, 'YYYY-MM') = TO_CHAR(d.date, 'YYYY-MM')
            OR TO_CHAR(r.receipt_date + INTERVAL '1 month', 'YYYY-MM') = TO_CHAR(d.date, 'YYYY-MM')
        )
        -- S'assurer qu'il reste de la place
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

-- 4.3 - PBF, EXPERTISE, NUMERAIRE, etc.
WITH autres_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND (
            (LOWER(d.libelle) LIKE '%pbf%' AND LOWER(r.description) LIKE '%pbf%')
            OR (LOWER(d.libelle) LIKE '%expertise%' AND LOWER(r.description) LIKE '%expertise%')
            OR (LOWER(d.libelle) LIKE '%numeraire%' AND LOWER(r.description) LIKE '%numeraire%')
            OR (LOWER(d.libelle) LIKE '%ahokokro%' AND LOWER(r.description) LIKE '%ahokokro%')
            OR (LOWER(d.libelle) LIKE '%kongodjan%' AND LOWER(r.description) LIKE '%kongodjan%')
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
    '✅ STRATÉGIE 2 - Mots-clés' as strategie,
    COUNT(*) as nb_liaisons_totales
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 5 : LIAISON PAR PROXIMITÉ (PRIORITÉ 3)
-- ═══════════════════════════════════════════════════════════════════════════
-- Pour les dépenses restantes, lier par date et montant proche
-- ═══════════════════════════════════════════════════════════════════════════

WITH proximite_matches AS (
    SELECT DISTINCT ON (d.id)
        d.id as depense_id,
        r.id as recette_id,
        d.libelle,
        d.montant,
        r.description,
        ABS(DATE_PART('day', d.date - r.receipt_date)) as ecart_jours,
        ABS((r.amount - r.solde_disponible) - d.montant) as ecart_montant
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
        AND ABS(DATE_PART('day', d.date - r.receipt_date)) <= 90  -- 90 jours
        AND (r.amount - r.solde_disponible) - COALESCE((
            SELECT SUM(montant) FROM depenses 
            WHERE recette_id = r.id AND id != d.id
        ), 0) >= d.montant
    ORDER BY d.id, ecart_montant, ecart_jours
)
UPDATE depenses d
SET recette_id = pm.recette_id
FROM proximite_matches pm
WHERE d.id = pm.depense_id;

SELECT 
    '✅ STRATÉGIE 3 - Proximité' as strategie,
    COUNT(*) as nb_liaisons_totales
FROM depenses 
WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 ÉTAPE 6 : RAPPORT FINAL DÉTAILLÉ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '══════════════════════════════════════' as separateur,
    '✅ CORRECTION TERMINÉE - RAPPORT FINAL' as titre;

-- Statistiques globales
SELECT 
    '📊 STATISTIQUES GLOBALES' as section,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) as pourcentage_liees,
    SUM(montant) as montant_total_depenses,
    SUM(CASE WHEN recette_id IS NOT NULL THEN montant ELSE 0 END) as montant_depenses_liees
FROM depenses;

-- Vérification par recette
SELECT 
    '══════════════════════════════════════' as separateur,
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

-- Dépenses toujours non liées
SELECT 
    '══════════════════════════════════════' as separateur,
    '❌ DÉPENSES TOUJOURS NON LIÉES' as section;

SELECT 
    libelle,
    montant,
    date,
    description
FROM depenses
WHERE recette_id IS NULL
ORDER BY montant DESC;

