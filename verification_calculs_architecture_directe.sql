-- 🔍 VÉRIFICATION DÉTAILLÉE DES CALCULS - ARCHITECTURE DIRECTE
-- Vérifier que tous les calculs sont cohérents

-- 1. VÉRIFICATION DES TOTAUX GLOBAUX
SELECT 
    'TOTAUX GLOBAUX' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as total_solde_disponible,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calcule
FROM recettes;

-- 2. VÉRIFICATION DES DÉPENSES RÉELLES
SELECT 
    'DÉPENSES RÉELLES' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_depenses_reelles
FROM depenses;

-- 3. VÉRIFICATION RECETTE PAR RECETTE
SELECT 
    'VÉRIFICATION INDIVIDUELLE' as info,
    r.libelle as libelle_recette,
    r.amount as montant_initial,
    r.solde_disponible as solde_actuel,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_calcule,
    (r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.libelle, r.amount, r.solde_disponible
ORDER BY difference DESC;

-- 4. VÉRIFICATION DES INCOHÉRENCES
SELECT 
    'INCOHÉRENCES DÉTECTÉES' as info,
    r.libelle as libelle_recette,
    r.amount as montant_initial,
    r.solde_disponible as solde_actuel,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_calcule,
    ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) as difference_absolue
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.libelle, r.amount, r.solde_disponible
HAVING ABS(r.solde_disponible - (r.amount - COALESCE(SUM(d.montant), 0))) > 0.01
ORDER BY difference_absolue DESC;

-- 5. VÉRIFICATION MATHÉMATIQUE FINALE
SELECT 
    'VÉRIFICATION MATHÉMATIQUE' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses_reelles,
    (SELECT SUM(solde_disponible) FROM recettes) as total_solde_disponible,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_calcule,
    ((SELECT SUM(solde_disponible) FROM recettes) - ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses))) as difference_finale;
