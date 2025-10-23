-- Vérification COMPLÈTE des totaux
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFICATION DES RECETTES
SELECT 
    'VÉRIFICATION RECETTES' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_recettes_amount,
    SUM(amount) as total_recettes_initiales
FROM recettes;

-- 2. VÉRIFICATION DES DÉPENSES
SELECT 
    'VÉRIFICATION DÉPENSES' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_depenses_montant
FROM depenses;

-- 3. VÉRIFICATION DES DÉPENSES PAR RECETTE
SELECT 
    'DÉPENSES PAR RECETTE' as info,
    r.description as libelle_recette,
    r.amount as montant_recette,
    COALESCE(SUM(d.montant), 0) as total_depenses_liees,
    r.amount - COALESCE(SUM(d.montant), 0) as solde_calcule
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC;

-- 4. VÉRIFICATION CROISÉE
SELECT 
    'VÉRIFICATION CROISÉE' as info,
    (SELECT COUNT(*) FROM recettes) as nb_recettes,
    (SELECT COUNT(*) FROM depenses) as nb_depenses,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses,
    (SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses) as solde_global;

-- 5. VÉRIFICATION DES DÉPENSES SANS RECETTE LIÉE
SELECT 
    'DÉPENSES SANS RECETTE' as info,
    COUNT(*) as nb_depenses_sans_recette,
    SUM(montant) as total_depenses_sans_recette
FROM depenses 
WHERE recette_id IS NULL;

-- 6. VÉRIFICATION DES RECETTES SANS DÉPENSES
SELECT 
    'RECETTES SANS DÉPENSES' as info,
    COUNT(*) as nb_recettes_sans_depenses,
    SUM(amount) as total_recettes_sans_depenses
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE d.id IS NULL;

-- 7. VÉRIFICATION DÉTAILLÉE DES MONTANTS
SELECT 
    'DÉTAIL MONTANTS' as info,
    r.description as libelle,
    r.amount as montant_recette,
    COUNT(d.id) as nb_depenses,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    r.amount - COALESCE(SUM(d.montant), 0) as solde_final
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
HAVING r.amount - COALESCE(SUM(d.montant), 0) != r.amount
ORDER BY r.created_at DESC;
