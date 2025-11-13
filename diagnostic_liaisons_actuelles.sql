-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 DIAGNOSTIC COMPLET DES LIAISONS DÉPENSES-RECETTES
-- ═══════════════════════════════════════════════════════════════════════════

-- 📊 1. ÉTAT GLOBAL DES LIAISONS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    'ÉTAT GLOBAL' as type,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) as pourcentage_liees
FROM depenses;

-- 📋 2. LISTE DE TOUTES LES RECETTES AVEC LEURS DÉPENSES LIÉES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    'RECETTES ET LEURS DÉPENSES' as titre;

SELECT 
    r.id as recette_id,
    r.description as recette_description,
    r.amount as montant_recette,
    r.solde_disponible as solde_disponible,
    (r.amount - r.solde_disponible) as total_depenses_attendu,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    COUNT(d.id) as nombre_depenses_liees,
    -- Vérification de cohérence
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1 
        THEN '✅ CORRECT'
        ELSE '❌ INCOHÉRENT'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.receipt_date DESC;

-- 📝 3. DÉTAIL DES DÉPENSES PAR RECETTE
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    'DÉTAIL DES DÉPENSES PAR RECETTE' as titre;

SELECT 
    r.description as recette,
    r.amount as montant_recette,
    d.libelle as depense,
    d.montant as montant_depense,
    d.date as date_depense,
    d.recette_id as est_liee,
    CASE 
        WHEN d.recette_id IS NOT NULL THEN '🔗 Liée'
        ELSE '❌ Non liée'
    END as statut_liaison
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
ORDER BY r.receipt_date DESC, d.date DESC;

-- ⚠️ 4. DÉPENSES NON LIÉES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    'DÉPENSES NON LIÉES' as titre;

SELECT 
    d.id,
    d.libelle,
    d.montant,
    d.date,
    d.description
FROM depenses d
WHERE d.recette_id IS NULL
ORDER BY d.date DESC;

-- 🎯 5. SUGGESTIONS DE LIAISON (basées sur les montants calculés)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    'SUGGESTIONS DE LIAISON' as titre;

SELECT 
    r.description as recette,
    r.amount as montant_recette,
    r.solde_disponible as solde_disponible,
    (r.amount - r.solde_disponible) as total_depenses_attendu,
    d.libelle as depense_possible,
    d.montant as montant_depense,
    d.recette_id as deja_liee,
    CASE 
        WHEN d.montant = (r.amount - r.solde_disponible) THEN '✅ MATCH EXACT'
        WHEN d.montant < (r.amount - r.solde_disponible) THEN '⚠️ MATCH PARTIEL'
        ELSE '❌ PAS DE MATCH'
    END as suggestion
FROM recettes r
CROSS JOIN depenses d
WHERE d.recette_id IS NULL
    AND d.montant <= (r.amount - r.solde_disponible)
ORDER BY r.receipt_date DESC, 
    CASE WHEN d.montant = (r.amount - r.solde_disponible) THEN 0 ELSE 1 END,
    ABS((r.amount - r.solde_disponible) - d.montant);


