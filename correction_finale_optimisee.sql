-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 CORRECTION FINALE OPTIMISÉE - COMBINAISONS ÉTENDUES
-- ═══════════════════════════════════════════════════════════════════════════
-- Stratégie :
-- 1. Garder les liaisons parfaites (écart = 0)
-- 2. Supprimer les sur-liaisons (TROP de dépenses)
-- 3. Trouver les combinaisons pour les recettes sans liaison
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔄 ÉTAPE 1 : CONSERVER LES LIAISONS PARFAITES
-- ═══════════════════════════════════════════════════════════════════════════

-- Identifier les recettes avec écart = 0 (parfaites)
CREATE TEMP TABLE recettes_parfaites AS
SELECT r.id as recette_id
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.amount, r.solde_disponible
HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 0.01
    OR ((r.amount - r.solde_disponible) = 0 AND COALESCE(SUM(d.montant), 0) = 0);

SELECT 
    '✅ Recettes parfaites identifiées' as etape,
    COUNT(*) as nb_recettes_parfaites
FROM recettes_parfaites;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔧 ÉTAPE 2 : SUPPRIMER LES SUR-LIAISONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Délier toutes les dépenses SAUF celles liées aux recettes parfaites
UPDATE depenses 
SET recette_id = NULL 
WHERE recette_id NOT IN (SELECT recette_id FROM recettes_parfaites);

SELECT 
    '🔄 Sur-liaisons supprimées' as etape,
    COUNT(*) as nb_depenses_deliees
FROM depenses 
WHERE recette_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 3 : LIAISON EXACTE - 1 DÉPENSE
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_1 AS (
    SELECT DISTINCT ON (d.id)
        d.id as d1,
        r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND r.id NOT IN (SELECT recette_id FROM recettes_parfaites)
        AND d.montant = (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) > 0
    ORDER BY d.id, r.receipt_date DESC
)
UPDATE depenses SET recette_id = (SELECT recette_id FROM match_1 WHERE depenses.id = d1)
WHERE id IN (SELECT d1 FROM match_1);

SELECT '✅ Combinaisons de 1 dépense' as etape, COUNT(*) as liaisons FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 4 : LIAISON EXACTE - 2 DÉPENSES
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_2 AS (
    SELECT DISTINCT ON (d1.id, d2.id)
        d1.id as dep1, d2.id as dep2, r.id as recette_id
    FROM depenses d1, depenses d2, recettes r
    WHERE d1.recette_id IS NULL AND d2.recette_id IS NULL
        AND d1.id < d2.id
        AND r.id NOT IN (SELECT recette_id FROM recettes_parfaites)
        AND (d1.montant + d2.montant) = (r.amount - r.solde_disponible)
        AND NOT EXISTS (SELECT 1 FROM depenses dx WHERE dx.recette_id = r.id)
    LIMIT 50
)
UPDATE depenses SET recette_id = (SELECT recette_id FROM match_2 WHERE depenses.id IN (dep1, dep2) LIMIT 1)
WHERE id IN (SELECT dep1 FROM match_2 UNION SELECT dep2 FROM match_2);

SELECT '✅ Combinaisons de 2 dépenses' as etape, COUNT(*) as liaisons FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 5 : LIAISON EXACTE - 3 DÉPENSES
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_3 AS (
    SELECT DISTINCT ON (d1.id, d2.id, d3.id)
        d1.id as dep1, d2.id as dep2, d3.id as dep3, r.id as recette_id
    FROM depenses d1, depenses d2, depenses d3, recettes r
    WHERE d1.recette_id IS NULL AND d2.recette_id IS NULL AND d3.recette_id IS NULL
        AND d1.id < d2.id AND d2.id < d3.id
        AND r.id NOT IN (SELECT recette_id FROM recettes_parfaites)
        AND (d1.montant + d2.montant + d3.montant) = (r.amount - r.solde_disponible)
        AND NOT EXISTS (SELECT 1 FROM depenses dx WHERE dx.recette_id = r.id)
    LIMIT 50
)
UPDATE depenses SET recette_id = (SELECT recette_id FROM match_3 WHERE depenses.id IN (dep1, dep2, dep3) LIMIT 1)
WHERE id IN (SELECT dep1 FROM match_3 UNION SELECT dep2 FROM match_3 UNION SELECT dep3 FROM match_3);

SELECT '✅ Combinaisons de 3 dépenses' as etape, COUNT(*) as liaisons FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 6 : LIAISON EXACTE - 4 DÉPENSES (pour les gros montants)
-- ═══════════════════════════════════════════════════════════════════════════

WITH match_4 AS (
    SELECT DISTINCT ON (d1.id, d2.id, d3.id, d4.id)
        d1.id as dep1, d2.id as dep2, d3.id as dep3, d4.id as dep4, r.id as recette_id
    FROM depenses d1, depenses d2, depenses d3, depenses d4, recettes r
    WHERE d1.recette_id IS NULL AND d2.recette_id IS NULL AND d3.recette_id IS NULL AND d4.recette_id IS NULL
        AND d1.id < d2.id AND d2.id < d3.id AND d3.id < d4.id
        AND r.id NOT IN (SELECT recette_id FROM recettes_parfaites)
        AND (d1.montant + d2.montant + d3.montant + d4.montant) = (r.amount - r.solde_disponible)
        AND NOT EXISTS (SELECT 1 FROM depenses dx WHERE dx.recette_id = r.id)
    LIMIT 30
)
UPDATE depenses SET recette_id = (SELECT recette_id FROM match_4 WHERE depenses.id IN (dep1, dep2, dep3, dep4) LIMIT 1)
WHERE id IN (SELECT dep1 FROM match_4 UNION SELECT dep2 FROM match_4 UNION SELECT dep3 FROM match_4 UNION SELECT dep4 FROM match_4);

SELECT '✅ Combinaisons de 4 dépenses' as etape, COUNT(*) as liaisons FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 7 : LIAISON PAR PROXIMITÉ (fallback pour cas complexes)
-- ═══════════════════════════════════════════════════════════════════════════
-- Uniquement pour les recettes restantes avec mots-clés spécifiques

-- Loyer Kennedy Novembre (30,000 F)
WITH kennedy_nov AS (
    SELECT d.id, r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND LOWER(r.description) LIKE '%kennedy%novembre%'
        AND LOWER(d.libelle) LIKE '%kennedy%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) = 30000
    ORDER BY d.montant DESC
    LIMIT 1
)
UPDATE depenses d SET recette_id = k.recette_id
FROM kennedy_nov k WHERE d.id = k.id;

-- PBF Ahokokro (89,000 F)
WITH pbf_aho AS (
    SELECT d.id, r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND LOWER(r.description) LIKE '%ahokokro%'
        AND LOWER(d.libelle) LIKE '%ahokokro%'
        AND d.montant <= (r.amount - r.solde_disponible)
        AND (r.amount - r.solde_disponible) = 89000
    ORDER BY d.montant DESC
    LIMIT 4
)
UPDATE depenses d SET recette_id = p.recette_id
FROM pbf_aho p WHERE d.id = p.id;

-- PBF Kongodjan (10,000 F)
WITH pbf_kong AS (
    SELECT d.id, r.id as recette_id
    FROM depenses d
    CROSS JOIN recettes r
    WHERE d.recette_id IS NULL
        AND LOWER(r.description) LIKE '%kongodjan%'
        AND LOWER(d.libelle) LIKE '%kongodjan%'
        AND d.montant = 10000
    LIMIT 1
)
UPDATE depenses d SET recette_id = k.recette_id
FROM pbf_kong k WHERE d.id = k.id;

SELECT '✅ Liaisons par mots-clés (fallback)' as etape, COUNT(*) as liaisons FROM depenses WHERE recette_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RAPPORT FINAL DÉTAILLÉ
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

SELECT '📋 RAPPORT PAR RECETTE' as section;

SELECT 
    r.description as recette,
    r.amount as montant,
    r.solde_disponible as solde,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COUNT(d.id) as nb_dep,
    COALESCE(SUM(d.montant), 0) as total_dep,
    ROUND((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0), 2) as ecart,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 0.01 THEN '✅ PARFAIT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 AND (r.amount - r.solde_disponible) = 0 THEN '✅ AUCUNE DÉPENSE'
        WHEN COALESCE(SUM(d.montant), 0) = 0 THEN '⚠️ AUCUNE LIAISON'
        WHEN COALESCE(SUM(d.montant), 0) > (r.amount - r.solde_disponible) THEN '❌ TROP'
        ELSE '⚠️ ÉCART'
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

-- Nettoyage
DROP TABLE IF EXISTS recettes_parfaites;


