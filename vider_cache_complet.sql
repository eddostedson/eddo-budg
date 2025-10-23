-- 🚨 VIDER LE CACHE COMPLET DE L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. FORCER LA MISE À JOUR DE TOUTES LES RECETTES
UPDATE recettes 
SET updated_at = NOW()
WHERE updated_at < NOW() - INTERVAL '1 hour';

-- 2. VÉRIFIER QUE LES DONNÉES SONT CORRECTES EN BASE
SELECT 
    'VÉRIFICATION BASE DE DONNÉES' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees
FROM recettes;

-- 3. AFFICHER TOUTES LES RECETTES POUR VÉRIFICATION
SELECT 
    'TOUTES LES RECETTES' as info,
    description,
    amount,
    solde_disponible,
    created_at,
    updated_at
FROM recettes 
ORDER BY amount DESC;

-- 4. VÉRIFIER LES DÉPENSES
SELECT 
    'DÉPENSES RÉELLES' as info,
    COUNT(*) as nb_depenses,
    SUM(montant) as total_depenses
FROM depenses;
