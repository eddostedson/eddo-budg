-- Suppression directe de PBF Ahokokro
-- À exécuter dans Supabase SQL Editor

-- 1. IDENTIFIER ET SUPPRIMER LES DÉPENSES LIÉES
DELETE FROM depenses 
WHERE recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.description LIKE '%PBF Ahokokro%'
);

-- 2. SUPPRIMER LA RECETTE
DELETE FROM recettes 
WHERE description LIKE '%PBF Ahokokro%'
RETURNING *;

-- 3. VÉRIFICATION
SELECT 
    'SUPPRESSION TERMINÉE' as info,
    COUNT(*) as nb_recettes_restantes
FROM recettes;
