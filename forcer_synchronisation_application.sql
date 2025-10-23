-- 🚨 FORCER LA SYNCHRONISATION DE L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. RECALCULER TOUS LES SOLDES DISPONIBLES
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0),
    updated_at = NOW();

-- 2. FORCER LA MISE À JOUR DES TIMESTAMPS POUR DÉCLENCHER LE REFRESH
UPDATE recettes 
SET updated_at = NOW() + INTERVAL '1 second';

-- 3. VÉRIFIER LES RÉSULTATS
SELECT 
    'SOLDE DISPONIBLE TOTAL' as info,
    SUM(solde_disponible) as solde_disponible_total
FROM recettes;

-- 4. VÉRIFIER LE TOTAL DES RECETTES
SELECT 
    'TOTAL RECETTES' as info,
    SUM(amount) as total_recettes
FROM recettes;

-- 5. VÉRIFIER LE TOTAL DES DÉPENSES
SELECT 
    'TOTAL DÉPENSES' as info,
    SUM(montant) as total_depenses
FROM depenses;

-- 6. VÉRIFICATION MATHÉMATIQUE FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses,
    (SELECT SUM(solde_disponible) FROM recettes) as solde_disponible_actuel,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_disponible_correct;
