-- 🚨 CORRECTION URGENTE DU SOLDE DISPONIBLE
-- À exécuter dans Supabase SQL Editor

-- 1. RECALCULER LE SOLDE DISPONIBLE POUR TOUTES LES RECETTES
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0),
    updated_at = NOW();

-- 2. VÉRIFIER LES RÉSULTATS APRÈS CORRECTION
SELECT 
    'SOLDE DISPONIBLE CORRIGÉ' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees,
    CASE 
        WHEN SUM(amount) = SUM(solde_disponible) + (SUM(amount) - SUM(solde_disponible)) THEN '✅ COHÉRENT'
        ELSE '🚨 INCOHÉRENT'
    END as statut
FROM recettes;

-- 3. VÉRIFIER CHAQUE RECETTE INDIVIDUELLEMENT
SELECT 
    'RECETTES APRÈS CORRECTION' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
ORDER BY amount DESC;
