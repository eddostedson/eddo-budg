-- ═══════════════════════════════════════════════════════════════════════════
-- 👀 ANALYSE VISUELLE SIMPLE - VUE D'ENSEMBLE
-- ═══════════════════════════════════════════════════════════════════════════
-- Script ultra-simple pour voir rapidement l'état de la base de données
-- ═══════════════════════════════════════════════════════════════════════════

-- 📊 VUE 1 : ÉTAT GLOBAL
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '📊 ÉTAT GLOBAL' as titre,
    (SELECT COUNT(*) FROM recettes) as nb_recettes,
    (SELECT COUNT(*) FROM depenses) as nb_depenses,
    (SELECT COUNT(*) FROM depenses WHERE recette_id IS NOT NULL) as depenses_liees,
    (SELECT COUNT(*) FROM depenses WHERE recette_id IS NULL) as depenses_non_liees;

-- 💰 VUE 2 : TOTAUX FINANCIERS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '💰 TOTAUX FINANCIERS' as titre,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(solde_disponible) FROM recettes) as total_solde_disponible,
    (SELECT SUM(amount - solde_disponible) FROM recettes) as total_depenses_attendu,
    (SELECT SUM(montant) FROM depenses) as total_depenses_actuelles;

-- 🔍 VUE 3 : RECETTES AVEC PROBLÈMES POTENTIELS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '🔍 RECETTES AVEC ÉCARTS' as titre,
    r.description,
    r.amount as montant,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COALESCE(SUM(d.montant), 0) as depenses_liees,
    (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as ecart
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) >= 1
ORDER BY ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) DESC;

-- ❌ VUE 4 : DÉPENSES NON LIÉES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '❌ DÉPENSES NON LIÉES' as titre,
    id,
    libelle,
    montant,
    date,
    description
FROM depenses
WHERE recette_id IS NULL
ORDER BY montant DESC
LIMIT 20;

-- ✅ VUE 5 : RECETTES CORRECTEMENT LIÉES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '✅ RECETTES OK' as titre,
    r.description,
    r.amount as montant,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COUNT(d.id) as nb_depenses,
    SUM(d.montant) as total_depenses
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
HAVING ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1
ORDER BY r.receipt_date DESC;


