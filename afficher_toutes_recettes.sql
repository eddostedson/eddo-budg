-- Afficher TOUTES les recettes (avec et sans dépenses)
-- À exécuter dans Supabase SQL Editor

-- 1. TOUTES LES RECETTES (sans filtre)
SELECT 
    'TOUTES LES RECETTES' as info,
    r.description as libelle,
    r.amount as montant_recette,
    COUNT(d.id) as nb_depenses,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    r.amount - COALESCE(SUM(d.montant), 0) as solde_final
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC;

-- 2. RÉSUMÉ COMPLET
SELECT 
    'RÉSUMÉ COMPLET' as info,
    COUNT(*) as nombre_total_recettes,
    SUM(r.amount) as total_recettes_initiales,
    SUM(COALESCE(d.montant, 0)) as total_depenses,
    SUM(r.amount) - SUM(COALESCE(d.montant, 0)) as solde_global
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id;

-- 3. RECETTES SANS DÉPENSES
SELECT 
    'RECETTES SANS DÉPENSES' as info,
    r.description as libelle,
    r.amount as montant_recette,
    'Aucune dépense' as statut
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
WHERE d.id IS NULL
ORDER BY r.created_at DESC;

-- 4. RECETTES AVEC DÉPENSES
SELECT 
    'RECETTES AVEC DÉPENSES' as info,
    r.description as libelle,
    r.amount as montant_recette,
    COUNT(d.id) as nb_depenses,
    SUM(d.montant) as total_depenses,
    r.amount - SUM(d.montant) as solde_final
FROM recettes r
INNER JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
ORDER BY r.created_at DESC;
