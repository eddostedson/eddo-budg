-- 🚨 VIDER LE CACHE DE L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. FORCER LA MISE À JOUR DES TIMESTAMPS
UPDATE recettes 
SET updated_at = NOW()
WHERE updated_at < NOW() - INTERVAL '1 hour';

-- 2. VÉRIFIER QUE LES DONNÉES SONT CORRECTES EN BASE
SELECT 
    'VÉRIFICATION BASE DE DONNÉES' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees,
    MAX(updated_at) as derniere_mise_a_jour
FROM recettes;

-- 3. AFFICHER CHAQUE RECETTE POUR VÉRIFICATION
SELECT 
    'DÉTAIL DES RECETTES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees,
    updated_at
FROM recettes 
ORDER BY amount DESC;
