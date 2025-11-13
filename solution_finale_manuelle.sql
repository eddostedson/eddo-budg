-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 SOLUTION FINALE - APPROCHE MANUELLE CIBLÉE
-- ═══════════════════════════════════════════════════════════════════════════
-- On garde les 5 recettes parfaites et on lie manuellement les autres
-- en utilisant une approche intelligente par montant et mots-clés
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔄 ÉTAPE 1 : RÉINITIALISER SAUF LES RECETTES PARFAITES
-- ═══════════════════════════════════════════════════════════════════════════

-- Identifier les ID des recettes parfaites
CREATE TEMP TABLE recettes_ok AS
SELECT r.id
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.amount, r.solde_disponible
HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 0.01;

-- Délier uniquement les dépenses des recettes problématiques
UPDATE depenses 
SET recette_id = NULL 
WHERE recette_id NOT IN (SELECT id FROM recettes_ok);

SELECT '🔄 Liaisons problématiques réinitialisées' as etape;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 ÉTAPE 2 : LIAISON INTELLIGENTE PAR RECETTE
-- ═══════════════════════════════════════════════════════════════════════════

-- Pour chaque recette problématique, on va lier les dépenses les plus
-- probables en fonction du montant et des mots-clés

-- LOYER KENNEDY NOVEMBRE (30,000 F attendus)
WITH kennedy_nov_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%kennedy%novembre%'
),
kennedy_depenses AS (
    SELECT d.id, d.montant, d.libelle,
        ROW_NUMBER() OVER (ORDER BY 
            CASE WHEN d.montant = 30000 THEN 0 ELSE 1 END,
            CASE WHEN LOWER(d.libelle) LIKE '%kennedy%' THEN 0 ELSE 1 END,
            ABS(d.montant - 30000)
        ) as rang
    FROM depenses d
    WHERE d.recette_id IS NULL
        AND d.montant <= 30000
    LIMIT 5
)
UPDATE depenses d
SET recette_id = (SELECT id FROM kennedy_nov_id)
FROM kennedy_depenses kd
WHERE d.id = kd.id 
    AND kd.rang = 1  -- Prendre seulement la meilleure correspondance
    AND EXISTS (SELECT 1 FROM kennedy_nov_id);

-- PBF AHOKOKRO (89,000 F attendus)
WITH aho_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%ahokokro%' AND (amount - solde_disponible) = 89000
)
UPDATE depenses d
SET recette_id = (SELECT id FROM aho_id)
WHERE d.recette_id IS NULL
    AND LOWER(d.libelle) LIKE '%ahokokro%'
    AND d.montant <= 89000
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL AND LOWER(libelle) LIKE '%ahokokro%'
        ORDER BY montant DESC
        LIMIT 10  -- Prendre les plus grosses dépenses Ahokokro
    )
    AND EXISTS (SELECT 1 FROM aho_id);

-- PBF KONGODJAN (10,000 F attendus)
WITH kong_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%kongodjan%' AND (amount - solde_disponible) = 10000
)
UPDATE depenses d
SET recette_id = (SELECT id FROM kong_id)
WHERE d.recette_id IS NULL
    AND (LOWER(d.libelle) LIKE '%kongodjan%' OR d.montant = 10000)
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL 
            AND (LOWER(libelle) LIKE '%kongodjan%' OR montant = 10000)
        ORDER BY CASE WHEN montant = 10000 THEN 0 ELSE 1 END, montant DESC
        LIMIT 1
    )
    AND EXISTS (SELECT 1 FROM kong_id);

-- SALAIRE SEPTEMBRE (257,450 F attendus)
WITH sept_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%salaire%septembre%'
)
UPDATE depenses d
SET recette_id = (SELECT id FROM sept_id)
WHERE d.recette_id IS NULL
    AND d.date BETWEEN '2025-09-01' AND '2025-10-15'  -- Période probable
    AND d.montant >= 1000  -- Ignorer les petites dépenses
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL 
            AND date BETWEEN '2025-09-01' AND '2025-10-15'
            AND montant >= 1000
        ORDER BY date, montant DESC
        LIMIT 20  -- Prendre les 20 plus probables
    )
    AND EXISTS (SELECT 1 FROM sept_id);

-- BSIC REVERSEMENT (384,871 F attendus)
WITH bsic_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%bsic%reversement%'
)
UPDATE depenses d
SET recette_id = (SELECT id FROM bsic_id)
WHERE d.recette_id IS NULL
    AND d.date BETWEEN '2025-10-01' AND '2025-10-31'  -- Période d'octobre
    AND d.montant >= 1000
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL 
            AND date BETWEEN '2025-10-01' AND '2025-10-31'
            AND montant >= 1000
        ORDER BY montant DESC
        LIMIT 25
    )
    AND EXISTS (SELECT 1 FROM bsic_id);

-- NUMERAIRE RECUPERE (237,000 F attendus)
WITH num_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%numeraire%'
)
UPDATE depenses d
SET recette_id = (SELECT id FROM num_id)
WHERE d.recette_id IS NULL
    AND (LOWER(d.libelle) LIKE '%numeraire%' OR LOWER(d.libelle) LIKE '%accd%')
    AND d.montant >= 1000
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL 
            AND (LOWER(libelle) LIKE '%numeraire%' OR LOWER(libelle) LIKE '%accd%')
        ORDER BY montant DESC
        LIMIT 15
    )
    AND EXISTS (SELECT 1 FROM num_id);

-- EXPERTISE JUILLET (447,800 F attendus)
WITH exp_juil_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%expertise%juillet%'
)
UPDATE depenses d
SET recette_id = (SELECT id FROM exp_juil_id)
WHERE d.recette_id IS NULL
    AND (
        LOWER(d.libelle) LIKE '%expertise%'
        OR LOWER(d.libelle) LIKE '%juillet%'
        OR d.date BETWEEN '2025-07-01' AND '2025-08-31'
    )
    AND d.montant >= 5000
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL 
            AND (LOWER(libelle) LIKE '%expertise%' OR date BETWEEN '2025-07-01' AND '2025-08-31')
            AND montant >= 5000
        ORDER BY montant DESC
        LIMIT 15
    )
    AND EXISTS (SELECT 1 FROM exp_juil_id);

-- EXPERTISE AOUT (262,249 F attendus)
WITH exp_aout_id AS (
    SELECT id FROM recettes WHERE LOWER(description) LIKE '%expertise%aout%'
)
UPDATE depenses d
SET recette_id = (SELECT id FROM exp_aout_id)
WHERE d.recette_id IS NULL
    AND (
        LOWER(d.libelle) LIKE '%expertise%'
        OR LOWER(d.libelle) LIKE '%aout%'
        OR LOWER(d.libelle) LIKE '%août%'
        OR d.date BETWEEN '2025-08-01' AND '2025-09-30'
    )
    AND d.montant >= 3000
    AND d.id IN (
        SELECT id FROM depenses 
        WHERE recette_id IS NULL 
            AND (LOWER(libelle) LIKE '%expertise%' OR date BETWEEN '2025-08-01' AND '2025-09-30')
            AND montant >= 3000
        ORDER BY montant DESC
        LIMIT 15
    )
    AND EXISTS (SELECT 1 FROM exp_aout_id);

SELECT '✅ Liaisons manuelles terminées' as etape;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RAPPORT FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;

SELECT 
    '📊 STATISTIQUES FINALES' as titre,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) || '%' as taux
FROM depenses;

SELECT '══════════════════════════════════════' as separateur;

SELECT 
    r.description as recette,
    (r.amount - r.solde_disponible) as attendu,
    COUNT(d.id) as nb_dep,
    COALESCE(SUM(d.montant), 0) as total,
    ROUND((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0), 2) as ecart,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1000 THEN '✅ BON'
        WHEN COALESCE(SUM(d.montant), 0) = 0 AND (r.amount - r.solde_disponible) = 0 THEN '✅ OK'
        ELSE '⚠️ ÉCART'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.receipt_date DESC;

DROP TABLE IF EXISTS recettes_ok;


