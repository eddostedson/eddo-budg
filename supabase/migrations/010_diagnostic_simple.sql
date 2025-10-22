-- Migration: Diagnostic Simple des Dépenses et Recettes
-- Description: Script simplifié pour diagnostiquer le problème des soldes

-- ============================================
-- PHASE 1: Voir toutes les dépenses
-- ============================================
SELECT 
    'LISTE DES DÉPENSES' as section,
    COUNT(*) as nombre_depenses,
    COALESCE(SUM(montant), 0) as total_depenses
FROM depenses;

-- Détail des dépenses (si elles existent)
SELECT 
    id,
    user_id,
    libelle,
    montant,
    date,
    description,
    created_at
FROM depenses
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- PHASE 2: Voir toutes les recettes avec leurs soldes
-- ============================================
SELECT 
    'LISTE DES RECETTES' as section,
    COUNT(*) as nombre_recettes,
    SUM(montant) as total_montants,
    SUM(solde_disponible) as total_soldes_disponibles,
    SUM(montant - solde_disponible) as difference_totale
FROM recettes;

-- Détail des recettes
SELECT 
    id,
    libelle,
    montant as montant_initial,
    solde_disponible,
    (montant - solde_disponible) as montant_utilise,
    statut,
    date_reception,
    created_at
FROM recettes
ORDER BY created_at DESC;

-- ============================================
-- PHASE 3: Identifier les recettes avec solde incorrect
-- ============================================
SELECT 
    'RECETTES AVEC SOLDE DIFFÉRENT DU MONTANT' as section,
    id,
    libelle,
    montant,
    solde_disponible,
    (montant - solde_disponible) as difference
FROM recettes
WHERE montant != solde_disponible
ORDER BY (montant - solde_disponible) DESC;

-- ============================================
-- SOLUTION: Corriger les soldes (À DÉCOMMENTER SI NÉCESSAIRE)
-- ============================================

-- Si vous voulez RÉINITIALISER tous les soldes au montant initial
-- (car vous n'avez pas de dépenses réelles)

-- UPDATE recettes
-- SET solde_disponible = montant
-- WHERE montant != solde_disponible;

-- Vérifier après correction
-- SELECT 
--     id,
--     libelle,
--     montant,
--     solde_disponible,
--     (montant - solde_disponible) as difference
-- FROM recettes
-- ORDER BY created_at DESC;

-- ============================================
-- MESSAGE FINAL
-- ============================================
SELECT 'Diagnostic terminé. Vérifiez les résultats ci-dessus.' as message;































