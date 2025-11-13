-- STATISTIQUES ULTRA-RAPIDES
SELECT 
    'RÉSULTAT FINAL' as titre,
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_liees,
    COUNT(*) - COUNT(recette_id) as depenses_non_liees,
    ROUND(COUNT(recette_id) * 100.0 / COUNT(*), 2) || '%' as pourcentage_reussite
FROM depenses;


