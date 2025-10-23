-- 🚨 CORRECTION SPÉCIFIQUE POUR EXPERTISE JUILLET 2025
-- À exécuter dans Supabase SQL Editor

-- 1. CORRIGER SPÉCIFIQUEMENT LA RECETTE EXPERTISE JUILLET 2025
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0),
    updated_at = NOW()
WHERE description = 'EXPERTISE : Budget de Fonctionnement Juillet 2025';

-- 2. VÉRIFIER LA CORRECTION
SELECT 
    'EXPERTISE JUILLET CORRIGÉE' as info,
    description,
    amount as montant_initial,
    solde_disponible,
    (amount - solde_disponible) as depenses_calculees
FROM recettes 
WHERE description = 'EXPERTISE : Budget de Fonctionnement Juillet 2025';

-- 3. RECALCULER TOUTES LES RECETTES POUR ÊTRE SÛR
UPDATE recettes 
SET solde_disponible = amount - COALESCE((
    SELECT SUM(d.montant) 
    FROM depenses d 
    WHERE d.recette_id = recettes.id
), 0),
    updated_at = NOW();

-- 4. VÉRIFIER LE TOTAL GLOBAL
SELECT 
    'TOTAL GLOBAL CORRIGÉ' as info,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as solde_disponible_total,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees
FROM recettes;
