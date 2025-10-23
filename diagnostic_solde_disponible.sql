-- DIAGNOSTIC DU SOLDE DISPONIBLE
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LE CALCUL DU SOLDE DISPONIBLE
SELECT 
    'DIAGNOSTIC SOLDE DISPONIBLE' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(amount - COALESCE(solde_disponible, 0)) as total_depenses_calculees,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(amount - COALESCE(solde_disponible, 0))) as solde_disponible_calcule
FROM recettes;

-- 2. VÉRIFIER CHAQUE RECETTE INDIVIDUELLEMENT
SELECT 
    'RECETTES INDIVIDUELLES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees,
    CASE 
        WHEN solde_disponible = amount THEN '⚠️ AUCUNE DÉPENSE'
        WHEN solde_disponible < amount THEN '✅ DÉPENSES PRÉSENTES'
        WHEN solde_disponible > amount THEN '🚨 ERREUR DE CALCUL'
        ELSE '❓ INCONNU'
    END as statut
FROM recettes 
ORDER BY amount DESC;

-- 3. VÉRIFIER LES DÉPENSES RÉELLES
SELECT 
    'DÉPENSES RÉELLES' as info,
    COUNT(*) as nb_depenses,
    SUM(montant) as total_depenses_reelles
FROM depenses;

-- 4. COMPARER AVEC LE SOLDE DISPONIBLE
SELECT 
    'COMPARAISON' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses_reelles,
    (SELECT SUM(solde_disponible) FROM recettes) as solde_disponible_actuel,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_disponible_correct;
