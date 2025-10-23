-- 🔍 VÉRIFICATION FINALE DE L'AFFICHAGE
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LE TOTAL GLOBAL
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees,
    CASE 
        WHEN SUM(amount) = SUM(solde_disponible) + (SUM(amount) - SUM(solde_disponible)) THEN '✅ COHÉRENT'
        ELSE '🚨 INCOHÉRENT'
    END as statut
FROM recettes;

-- 2. VÉRIFIER CHAQUE RECETTE INDIVIDUELLEMENT
SELECT 
    'DÉTAIL TOUTES LES RECETTES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees,
    CASE 
        WHEN solde_disponible = amount THEN '✅ AUCUNE DÉPENSE'
        WHEN solde_disponible < amount THEN '✅ DÉPENSES PRÉSENTES'
        WHEN solde_disponible > amount THEN '🚨 ERREUR DE CALCUL'
        ELSE '❓ INCONNU'
    END as statut
FROM recettes 
ORDER BY amount DESC;

-- 3. VÉRIFIER LES RECETTES AVEC DES DÉPENSES
SELECT 
    'RECETTES AVEC DÉPENSES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
WHERE solde_disponible < amount
ORDER BY (amount - solde_disponible) DESC;
