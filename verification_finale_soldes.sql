-- VÉRIFICATION FINALE DES SOLDES DISPONIBLES
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER CHAQUE RECETTE INDIVIDUELLEMENT
SELECT 
    'VÉRIFICATION INDIVIDUELLE' as info,
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

-- 2. VÉRIFIER LES RECETTES AVEC DES DÉPENSES
SELECT 
    'RECETTES AVEC DÉPENSES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
WHERE solde_disponible < amount
ORDER BY (amount - solde_disponible) DESC;
