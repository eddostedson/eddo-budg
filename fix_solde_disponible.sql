-- Script pour corriger le solde_disponible des recettes
-- Ce script recalcule correctement tous les soldes basés sur les dépenses réelles

-- 1. DIAGNOSTIC AVANT CORRECTION
SELECT 
    'DIAGNOSTIC AVANT' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    COALESCE(SUM(d.montant), 0) as total_depenses_calcule,
    (r.montant - COALESCE(SUM(d.montant), 0)) as solde_correct,
    (r.solde_disponible - (r.montant - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.libelle, r.montant, r.solde_disponible
ORDER BY r.created_at;

-- 2. CORRECTION DES SOLDES
-- Recalculer le solde_disponible = montant - total_depenses
UPDATE recettes 
SET solde_disponible = (
    SELECT r.montant - COALESCE(SUM(d.montant), 0)
    FROM recettes r
    LEFT JOIN depenses d ON r.id = d.recette_id
    WHERE r.id = recettes.id
    GROUP BY r.id
);

-- 3. VÉRIFICATION APRÈS CORRECTION
SELECT 
    'APRÈS CORRECTION' as etat,
    r.id,
    r.libelle,
    r.montant,
    r.solde_disponible,
    COALESCE(SUM(d.montant), 0) as total_depenses_calcule,
    (r.montant - COALESCE(SUM(d.montant), 0)) as solde_correct,
    (r.solde_disponible - (r.montant - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.libelle, r.montant, r.solde_disponible
ORDER BY r.created_at;

-- 4. VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nombre_recettes,
    SUM(montant) as total_montants,
    SUM(solde_disponible) as total_soldes,
    SUM(montant - solde_disponible) as total_depenses_calculees
FROM recettes;

