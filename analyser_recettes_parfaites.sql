-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 ANALYSE DES RECETTES PARFAITES - TROUVER LE PATTERN
-- ═══════════════════════════════════════════════════════════════════════════
-- Objectif : Comprendre pourquoi ces 7 recettes sont parfaitement liées
-- et utiliser ce pattern pour corriger les 6 autres
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 ÉTAPE 1 : IDENTIFIER LES RECETTES PARFAITES
-- ═══════════════════════════════════════════════════════════════════════════

WITH recettes_parfaites AS (
    SELECT 
        r.id,
        r.description,
        r.amount,
        r.solde_disponible,
        (r.amount - r.solde_disponible) as depenses_attendues,
        COUNT(d.id) as nb_depenses_liees,
        COALESCE(SUM(d.montant), 0) as total_depenses_liees,
        (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as ecart
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.description, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1000
)
SELECT 
    '✅ RECETTES PARFAITES' as titre,
    description,
    depenses_attendues,
    nb_depenses_liees,
    total_depenses_liees,
    ecart
FROM recettes_parfaites
ORDER BY depenses_attendues DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 ÉTAPE 2 : ANALYSER LES DÉPENSES LIÉES AUX RECETTES PARFAITES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;
SELECT '🔍 DÉTAIL DES DÉPENSES DES RECETTES PARFAITES' as titre;

WITH recettes_parfaites AS (
    SELECT r.id
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1000
)
SELECT 
    r.description as recette,
    (r.amount - r.solde_disponible) as montant_recette,
    d.libelle as depense,
    d.montant as montant_depense,
    d.date as date_depense,
    -- Analyse de la correspondance
    CASE 
        WHEN d.montant = (r.amount - r.solde_disponible) THEN '💎 MATCH EXACT'
        WHEN LOWER(d.libelle) LIKE '%' || LOWER(SPLIT_PART(r.description, ' ', 1)) || '%' THEN '🔤 MOT-CLÉ COMMUN'
        WHEN LOWER(d.libelle) LIKE '%' || LOWER(SPLIT_PART(r.description, ' ', 2)) || '%' THEN '🔤 MOT-CLÉ COMMUN'
        WHEN d.date BETWEEN r.receipt_date - INTERVAL '30 days' AND r.receipt_date + INTERVAL '30 days' THEN '📅 PROXIMITÉ DATE'
        ELSE '❓ AUTRE'
    END as type_correspondance
FROM recettes r
JOIN depenses d ON d.recette_id = r.id
WHERE r.id IN (SELECT id FROM recettes_parfaites)
ORDER BY r.description, d.montant DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 ÉTAPE 3 : PATTERNS COMMUNS DES RECETTES PARFAITES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;
SELECT '📊 ANALYSE DES PATTERNS' as titre;

WITH recettes_parfaites AS (
    SELECT r.id, r.description,
        (r.amount - r.solde_disponible) as montant,
        COUNT(d.id) as nb_dep
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.description, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1000
),
patterns AS (
    SELECT 
        CASE 
            WHEN montant = 0 THEN '🟢 RECETTES SANS DÉPENSES'
            WHEN nb_dep = 1 THEN '🔵 UNE SEULE DÉPENSE'
            WHEN nb_dep <= 3 THEN '🟡 2-3 DÉPENSES'
            ELSE '🔴 PLUS DE 3 DÉPENSES'
        END as pattern,
        CASE 
            WHEN montant = 0 THEN 0
            WHEN nb_dep = 1 THEN 1
            WHEN nb_dep <= 3 THEN 2
            ELSE 3
        END as ordre,
        description
    FROM recettes_parfaites
)
SELECT 
    pattern,
    COUNT(*) as nb_recettes,
    string_agg(description, ', ') as exemples
FROM patterns
GROUP BY pattern, ordre
ORDER BY ordre;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔑 ÉTAPE 4 : EXTRAIRE LES MOTS-CLÉS QUI ONT FONCTIONNÉ
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;
SELECT '🔑 MOTS-CLÉS QUI ONT RÉUSSI' as titre;

WITH recettes_parfaites AS (
    SELECT r.id, r.description
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.description, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1000
)
SELECT DISTINCT
    LOWER(SPLIT_PART(r.description, ' ', 1)) as mot1,
    LOWER(SPLIT_PART(r.description, ' ', 2)) as mot2,
    LOWER(SPLIT_PART(r.description, ':', 1)) as categorie,
    r.description as recette_complete,
    string_agg(DISTINCT LOWER(SUBSTRING(d.libelle, 1, 20)), ', ') as debut_depenses
FROM recettes r
JOIN depenses d ON d.recette_id = r.id
WHERE r.id IN (SELECT id FROM recettes_parfaites)
GROUP BY r.id, r.description;

-- ═══════════════════════════════════════════════════════════════════════════
-- ❌ ÉTAPE 5 : ANALYSER LES RECETTES PROBLÉMATIQUES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;
SELECT '❌ RECETTES PROBLÉMATIQUES VS PARFAITES' as titre;

WITH recettes_problematiques AS (
    SELECT 
        r.id,
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu,
        COUNT(d.id) as nb_dep
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.description, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) >= 1000
)
SELECT 
    '❌ PROBLÉMATIQUES' as type,
    description,
    montant_attendu,
    nb_dep,
    CASE 
        WHEN montant_attendu = 0 THEN '🟢 DEVRAIT ÊTRE 0'
        WHEN nb_dep = 0 THEN '⚠️ AUCUNE DÉPENSE LIÉE'
        WHEN nb_dep = 1 THEN '🔵 UNE SEULE DÉPENSE'
        WHEN nb_dep <= 10 THEN '🟡 2-10 DÉPENSES'
        ELSE '🔴 PLUS DE 10 DÉPENSES'
    END as pattern
FROM recettes_problematiques
ORDER BY montant_attendu DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💡 ÉTAPE 6 : RECOMMANDATIONS BASÉES SUR L'ANALYSE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '══════════════════════════════════════' as separateur;
SELECT '💡 CONCLUSIONS' as titre;

SELECT 
    'Les recettes parfaites ont généralement :' as observation,
    '1️⃣ 0-3 dépenses maximum' as pattern1,
    '2️⃣ Des mots-clés clairs (Kennedy, PBF, RELIQUAT)' as pattern2,
    '3️⃣ Une correspondance de montant simple' as pattern3,
    '4️⃣ Les recettes à 0 F sont faciles (aucune dépense)' as pattern4;

SELECT 
    'Les recettes problématiques ont :' as observation,
    '❌ Plus de 10 dépenses à lier' as probleme1,
    '❌ Pas de mots-clés clairs dans les dépenses' as probleme2,
    '❌ Montants élevés nécessitant des combinaisons complexes' as probleme3,
    '❌ Dates vagues ou périodes longues' as probleme4;

