-- Migration: Vérifier et nettoyer les dépenses
-- Description: Script pour diagnostiquer et corriger les problèmes de dépenses et soldes

-- ============================================
-- PHASE 1: DIAGNOSTIC - Afficher les dépenses existantes
-- ============================================

-- Voir toutes les dépenses dans la table
SELECT 
    id,
    user_id,
    libelle,
    montant,
    date,
    recette_id,
    created_at
FROM depenses
ORDER BY created_at DESC;

-- Compter le nombre total de dépenses
SELECT COUNT(*) as nombre_depenses, SUM(montant) as total_depenses
FROM depenses;

-- ============================================
-- PHASE 2: DIAGNOSTIC - Vérifier les recettes et leurs soldes
-- ============================================

-- Voir toutes les recettes avec leurs soldes
SELECT 
    id,
    libelle,
    montant as montant_initial,
    solde_disponible,
    (montant - solde_disponible) as montant_utilise,
    created_at
FROM recettes
ORDER BY created_at DESC;

-- ============================================
-- PHASE 3: VÉRIFIER LA COHÉRENCE
-- ============================================

-- Vérifier si le solde_disponible correspond aux dépenses réelles
SELECT 
    r.id as recette_id,
    r.libelle as recette_libelle,
    r.montant as recette_montant,
    r.solde_disponible as recette_solde,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    (r.montant - COALESCE(SUM(d.montant), 0)) as solde_calcule,
    (r.solde_disponible - (r.montant - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id::text
GROUP BY r.id, r.libelle, r.montant, r.solde_disponible
HAVING r.solde_disponible != (r.montant - COALESCE(SUM(d.montant), 0));

-- ============================================
-- PHASE 4: CORRECTION - Réinitialiser les soldes
-- ============================================

-- ATTENTION: Décommentez cette section seulement si vous voulez corriger les soldes

-- Mettre à jour le solde_disponible de chaque recette en fonction des dépenses réelles
-- UPDATE recettes r
-- SET solde_disponible = r.montant - COALESCE(
--     (SELECT SUM(d.montant) 
--      FROM depenses d 
--      WHERE d.recette_id = r.id::text),
--     0
-- );

-- Vérifier après correction
-- SELECT 
--     id,
--     libelle,
--     montant as montant_initial,
--     solde_disponible,
--     (montant - solde_disponible) as montant_utilise
-- FROM recettes
-- ORDER BY created_at DESC;

-- ============================================
-- PHASE 5: OPTION - Supprimer toutes les dépenses (si nécessaire)
-- ============================================

-- ATTENTION: Décommentez cette section seulement si vous voulez supprimer TOUTES les dépenses

-- DELETE FROM depenses;

-- Puis réinitialiser tous les soldes au montant initial
-- UPDATE recettes
-- SET solde_disponible = montant;

-- ============================================
-- MESSAGE DE FIN
-- ============================================

SELECT 'Script de diagnostic terminé. Vérifiez les résultats ci-dessus.' AS message;
























