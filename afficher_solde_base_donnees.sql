-- 🔍 AFFICHER LE SOLDE DISPONIBLE EN BASE DE DONNÉES
-- À exécuter dans Supabase SQL Editor

-- 1. AFFICHER LE SOLDE DISPONIBLE TOTAL
SELECT 
    'SOLDE DISPONIBLE TOTAL' as info,
    SUM(solde_disponible) as solde_disponible_total
FROM recettes;

-- 2. AFFICHER LE TOTAL DES RECETTES
SELECT 
    'TOTAL RECETTES' as info,
    SUM(amount) as total_recettes
FROM recettes;

-- 3. AFFICHER LE TOTAL DES DÉPENSES
SELECT 
    'TOTAL DÉPENSES' as info,
    SUM(montant) as total_depenses
FROM depenses;

-- 4. AFFICHER CHAQUE RECETTE AVEC SON SOLDE
SELECT 
    'DÉTAIL DES RECETTES' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
ORDER BY amount DESC;

-- 5. VÉRIFICATION MATHÉMATIQUE
SELECT 
    'VÉRIFICATION MATHÉMATIQUE' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses,
    (SELECT SUM(solde_disponible) FROM recettes) as solde_disponible_actuel,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_disponible_correct;
