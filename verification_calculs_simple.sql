-- 🔍 VÉRIFICATION SIMPLE DES CALCULS - ARCHITECTURE DIRECTE
-- Script simplifié pour éviter les erreurs de colonnes

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

-- 3. VÉRIFICATION MATHÉMATIQUE FINALE
SELECT 
    'VÉRIFICATION MATHÉMATIQUE' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses_reelles,
    (SELECT SUM(solde_disponible) FROM recettes) as total_solde_disponible,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_calcule,
    ((SELECT SUM(solde_disponible) FROM recettes) - ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses))) as difference_finale;
