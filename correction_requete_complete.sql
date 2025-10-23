-- Correction de la requête pour afficher TOUTES les recettes
-- À exécuter dans Supabase SQL Editor

-- REQUÊTE CORRIGÉE (sans filtre HAVING)
SELECT 
    'DÉTAIL MONTANTS - TOUTES RECETTES' as info,
    r.description as libelle,
    r.amount as montant_recette,
    COUNT(d.id) as nb_depenses,
    COALESCE(SUM(d.montant), 0) as total_depenses,
    r.amount - COALESCE(SUM(d.montant), 0) as solde_final
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id
GROUP BY r.id, r.description, r.amount
-- SUPPRIMER LA CLAUSE HAVING QUI FILTRE LES RECETTES
ORDER BY r.created_at DESC;

-- VÉRIFICATION DES TOTAUX
SELECT 
    'VÉRIFICATION TOTAUX' as info,
    COUNT(*) as nombre_total_recettes,
    SUM(r.amount) as total_recettes_initiales,
    SUM(COALESCE(d.montant, 0)) as total_depenses,
    SUM(r.amount) - SUM(COALESCE(d.montant, 0)) as solde_global_correct
FROM recettes r
LEFT JOIN depenses d ON r.id = d.recette_id;
