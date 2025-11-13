-- Script de diagnostic combiné - UN SEUL RÉSULTAT

-- Statistiques générales
SELECT 
    'STATISTIQUES GÉNÉRALES' as info,
    (SELECT COUNT(*) FROM depenses) as nombre_depenses,
    (SELECT COALESCE(SUM(montant), 0) FROM depenses) as total_depenses,
    (SELECT COUNT(*) FROM recettes) as nombre_recettes,
    (SELECT SUM(montant) FROM recettes) as total_recettes,
    (SELECT SUM(solde_disponible) FROM recettes) as total_solde_disponible,
    (SELECT SUM(montant - solde_disponible) FROM recettes) as difference_mystere;






































