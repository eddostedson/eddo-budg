-- 🔍 VÉRIFIER LES RECETTES POUR L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER TOUTES LES RECETTES
SELECT 
    'RECETTES POUR APPLICATION' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total
FROM recettes;

-- 2. AFFICHER TOUTES LES RECETTES
SELECT 
    'DÉTAIL DES RECETTES' as info,
    description,
    amount,
    solde_disponible,
    created_at,
    updated_at
FROM recettes 
ORDER BY amount DESC;

-- 3. VÉRIFIER LES RECETTES PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes
FROM recettes 
GROUP BY user_id
ORDER BY nb_recettes DESC;
