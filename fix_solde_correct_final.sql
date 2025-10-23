-- Script de correction FINALE du solde
-- À exécuter dans Supabase SQL Editor

-- 1. DIAGNOSTIC COMPLET
SELECT 
    'DIAGNOSTIC COMPLET' as info,
    COUNT(*) as nombre_recettes,
    SUM(r.amount) as total_recettes_initiales,
    SUM(COALESCE(d.montant, 0)) as total_depenses,
    SUM(r.amount) - SUM(COALESCE(d.montant, 0)) as solde_correct_attendu
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id;

-- 2. CORRECTION DU SOLDE DISPONIBLE
-- Mettre à jour le solde_disponible = montant_initial - total_depenses
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
    'APRÈS CORRECTION' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_solde_disponible_corrige,
    SUM(COALESCE(d.montant, 0)) as total_depenses,
    SUM(amount) + SUM(COALESCE(d.montant, 0)) as total_recettes_initiales
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id;

-- 4. VÉRIFICATION PAR RECETTE
SELECT 
    'DÉTAIL PAR RECETTE' as info,
    r.description as libelle,
    r.amount as solde_disponible,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    r.amount + COALESCE(SUM(d.montant), 0) as montant_initial
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC
LIMIT 10;
