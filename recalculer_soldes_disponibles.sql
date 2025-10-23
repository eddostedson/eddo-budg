-- RECALCULER TOUS LES SOLDES DISPONIBLES
-- À exécuter dans Supabase SQL Editor

-- 1. RECALCULER LE SOLDE DISPONIBLE POUR TOUTES LES RECETTES
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0),
    updated_at = NOW();

-- 2. VÉRIFIER LES RÉSULTATS APRÈS RECALCUL
SELECT 
    'SOLDES RECALCULÉS' as info,
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

-- 3. VÉRIFIER LE TOTAL GLOBAL
SELECT 
    'TOTAL GLOBAL' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees
FROM recettes;
