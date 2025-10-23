-- 🔍 VÉRIFICATION FINALE DES TOTAUX
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LE TOTAL GLOBAL
SELECT 
    'TOTAL GLOBAL FINAL' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees,
    CASE 
        WHEN SUM(amount) = SUM(solde_disponible) + (SUM(amount) - SUM(solde_disponible)) THEN '✅ COHÉRENT'
        ELSE '🚨 INCOHÉRENT'
    END as statut
FROM recettes;

-- 2. VÉRIFIER LES DÉPENSES RÉELLES
SELECT 
    'DÉPENSES RÉELLES' as info,
    COUNT(*) as nb_depenses,
    SUM(montant) as total_depenses_reelles
FROM depenses;

-- 3. COMPARER AVEC LE SOLDE DISPONIBLE
SELECT 
    'COMPARAISON FINALE' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses_reelles,
    (SELECT SUM(solde_disponible) FROM recettes) as solde_disponible_actuel,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_disponible_correct;
