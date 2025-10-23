-- Correction de la suppression des recettes
-- À exécuter dans Supabase SQL Editor

-- 1. SUPPRIMER D'ABORD LES DÉPENSES LIÉES
DELETE FROM depenses 
WHERE recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.description LIKE '%PBF Ahokokro%'
);

-- 2. PUIS SUPPRIMER LA RECETTE
DELETE FROM recettes 
WHERE description LIKE '%PBF Ahokokro%'
RETURNING *;

-- 3. VÉRIFICATION
SELECT 
    'VÉRIFICATION APRÈS SUPPRESSION' as info,
    COUNT(*) as nb_recettes_restantes,
    COUNT(CASE WHEN description LIKE '%PBF Ahokokro%' THEN 1 END) as nb_ahokokro_restantes
FROM recettes;
