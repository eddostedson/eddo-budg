-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 STATISTIQUES FINALES DES LIAISONS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. STATISTIQUES GLOBALES
SELECT 
    '📊 STATISTIQUES GLOBALES' as section,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) || '%' as taux_liaison,
    SUM(montant) as montant_total_depenses,
    SUM(CASE WHEN recette_id IS NOT NULL THEN montant ELSE 0 END) as montant_depenses_liees
FROM depenses;

-- 2. VÉRIFICATION PAR RECETTE (avec statut)
SELECT 
    '📋 VÉRIFICATION PAR RECETTE' as section;

SELECT 
    r.description as recette,
    r.amount as montant_recette,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COUNT(d.id) as nb_depenses_liees,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as ecart,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1 THEN '✅ PARFAIT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 AND (r.amount - r.solde_disponible) = 0 THEN '✅ AUCUNE DÉPENSE'
        WHEN COALESCE(SUM(d.montant), 0) = 0 THEN '⚠️ AUCUNE LIAISON'
        ELSE '⚠️ ÉCART: ' || ROUND(ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)), 2) || ' F'
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

-- 3. TOP 10 DÉPENSES NON LIÉES
SELECT 
    '❌ TOP 10 DÉPENSES NON LIÉES' as section;

SELECT 
    libelle,
    montant,
    date,
    description
FROM depenses
WHERE recette_id IS NULL
ORDER BY montant DESC
LIMIT 10;

-- 4. EXEMPLES DE LIAISONS RÉUSSIES
SELECT 
    '✅ EXEMPLES DE LIAISONS RÉUSSIES' as section;

SELECT 
    r.description as recette,
    d.libelle as depense,
    d.montant,
    d.date
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
ORDER BY d.montant DESC
LIMIT 10;


