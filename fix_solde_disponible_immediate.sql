-- Script de correction IMMÉDIATE du solde disponible
-- À exécuter dans Supabase SQL Editor

-- 1. DIAGNOSTIC COMPLET AVANT CORRECTION
SELECT 
    'DIAGNOSTIC COMPLET' as info,
    r.id,
    r.description as libelle,
    r.amount as montant_initial,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    (r.amount - COALESCE(SUM(d.montant), 0)) as solde_correct,
    r.amount as solde_actuel_incorrect,
    (r.amount - (r.amount - COALESCE(SUM(d.montant), 0))) as difference
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC;

-- 2. CALCULER LE TOTAL ATTENDU
SELECT 
    'TOTAL ATTENDU' as info,
    SUM(r.amount) as total_recettes,
    SUM(COALESCE(d.montant, 0)) as total_depenses,
    SUM(r.amount) - SUM(COALESCE(d.montant, 0)) as solde_total_correct
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id;

-- 3. CORRECTION IMMÉDIATE
-- Mettre à jour le solde_disponible = montant - total_depenses
UPDATE recettes 
SET amount = (
    SELECT r.amount - COALESCE(SUM(d.montant), 0)
    FROM recettes r
    LEFT JOIN depenses d ON r.id = d.recette_id
    WHERE r.id = recettes.id
    GROUP BY r.id
);

-- 4. VÉRIFICATION APRÈS CORRECTION
SELECT 
    'APRÈS CORRECTION' as info,
    r.id,
    r.description as libelle,
    r.amount as solde_corrige,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    (r.amount + COALESCE(SUM(d.montant), 0)) as montant_initial_calcule
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC;

-- 5. VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_solde_disponible,
    SUM(COALESCE(d.montant, 0)) as total_depenses,
    SUM(amount) + SUM(COALESCE(d.montant, 0)) as total_recettes_calcule
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id;
