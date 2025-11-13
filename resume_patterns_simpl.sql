-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 RÉSUMÉ SIMPLE DES PATTERNS
-- ═══════════════════════════════════════════════════════════════════════════

-- RECETTES PARFAITES avec nombre de dépenses
WITH parfaites AS (
    SELECT 
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu,
        COUNT(d.id) as nb_depenses
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.description, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1000
)
SELECT 
    '✅ PARFAITES' as type,
    description,
    montant_attendu,
    nb_depenses,
    CASE 
        WHEN nb_depenses = 0 THEN '🟢 AUCUNE DÉPENSE'
        WHEN nb_depenses = 1 THEN '🔵 1 DÉPENSE'
        WHEN nb_depenses <= 3 THEN '🟡 2-3 DÉPENSES'
        ELSE '🔴 PLUS DE 3'
    END as pattern
FROM parfaites
ORDER BY nb_depenses, montant_attendu DESC;

-- Séparateur
SELECT '══════════════════════════════════════' as separateur;

-- RECETTES PROBLÉMATIQUES avec nombre de dépenses
WITH problematiques AS (
    SELECT 
        r.description,
        (r.amount - r.solde_disponible) as montant_attendu,
        COUNT(d.id) as nb_depenses,
        COALESCE(SUM(d.montant), 0) as total_lie
    FROM recettes r
    LEFT JOIN depenses d ON d.recette_id = r.id
    GROUP BY r.id, r.description, r.amount, r.solde_disponible
    HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) >= 1000
)
SELECT 
    '❌ PROBLÉMATIQUES' as type,
    description,
    montant_attendu,
    nb_depenses,
    total_lie,
    CASE 
        WHEN nb_depenses = 0 THEN '⚠️ AUCUNE LIAISON'
        WHEN nb_depenses <= 5 THEN '🟡 1-5 DÉPENSES'
        WHEN nb_depenses <= 15 THEN '🟠 6-15 DÉPENSES'
        ELSE '🔴 PLUS DE 15'
    END as pattern
FROM problematiques
ORDER BY nb_depenses DESC, montant_attendu DESC;

-- Résumé
SELECT '══════════════════════════════════════' as separateur;

SELECT 
    '💡 CONCLUSION' as titre,
    'Les recettes PARFAITES ont 0-3 dépenses maximum' as observation1,
    'Les recettes PROBLÉMATIQUES ont 10+ dépenses ou aucune' as observation2,
    'Solution: Liaison manuelle dans l''application' as recommendation;


