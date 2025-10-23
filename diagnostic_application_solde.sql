-- 🔍 DIAGNOSTIC DU PROBLÈME CÔTÉ APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LE SOLDE DISPONIBLE EN BASE
SELECT 
    'SOLDE DISPONIBLE EN BASE' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees
FROM recettes;

-- 2. VÉRIFIER LES RECETTES AVEC DES SOLDES DISPONIBLES
SELECT 
    'RECETTES AVEC SOLDES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
WHERE solde_disponible < amount
ORDER BY (amount - solde_disponible) DESC;

-- 3. VÉRIFIER LES RECETTES SANS DÉPENSES
SELECT 
    'RECETTES SANS DÉPENSES' as info,
    description,
    amount as montant_initial,
    solde_disponible
FROM recettes 
WHERE solde_disponible = amount
ORDER BY amount DESC;

-- 4. VÉRIFIER LES DÉPENSES RÉELLES
SELECT 
    'DÉPENSES RÉELLES' as info,
    COUNT(*) as nb_depenses,
    SUM(montant) as total_depenses
FROM depenses;
