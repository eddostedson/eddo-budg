-- Script de correction du calcul du solde
-- À exécuter dans Supabase SQL Editor

-- 1. DIAGNOSTIC AVANT CORRECTION
SELECT 
    'DIAGNOSTIC AVANT' as etat,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.amount as solde_disponible_actuel,
    COALESCE(SUM(d.montant), 0) as total_depenses_calcule,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct,
    (r.amount - (r.amount - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at;

-- 2. CORRECTION DES SOLDES
-- Mettre à jour le solde_disponible = montant - total_depenses
UPDATE recettes 
SET amount = (
    SELECT r.amount - COALESCE(SUM(d.montant), 0)
    FROM recettes r
    LEFT JOIN depenses d ON r.id = d.recette_id
    WHERE r.id = recettes.id
    GROUP BY r.id
);

-- 3. VÉRIFICATION APRÈS CORRECTION
SELECT 
    'APRÈS CORRECTION' as etat,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.amount as solde_disponible_actuel,
    COALESCE(SUM(d.montant), 0) as total_depenses_calcule,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct,
    (r.amount - (r.amount - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at;

-- 4. VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_montants,
    SUM(amount) as total_soldes,
    SUM(amount - amount) as total_depenses_calculees
FROM recettes;
