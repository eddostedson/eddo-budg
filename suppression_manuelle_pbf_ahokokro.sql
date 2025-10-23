-- Suppression manuelle de PBF Ahokokro
-- À exécuter dans Supabase SQL Editor

-- 1. IDENTIFIER LA RECETTE
SELECT 
    'IDENTIFICATION RECETTE' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.user_id,
    r.created_at
FROM recettes r
WHERE r.description LIKE '%PBF Ahokokro%'
ORDER BY r.created_at DESC;

-- 2. IDENTIFIER LES DÉPENSES LIÉES
SELECT 
    'DÉPENSES LIÉES' as info,
    d.id,
    d.libelle,
    d.montant,
    d.recette_id,
    d.user_id
FROM depenses d
WHERE d.recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.description LIKE '%PBF Ahokokro%'
);

-- 3. SUPPRIMER LES DÉPENSES LIÉES (si elles existent)
DELETE FROM depenses 
WHERE recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.description LIKE '%PBF Ahokokro%'
);

-- 4. SUPPRIMER LA RECETTE
DELETE FROM recettes 
WHERE description LIKE '%PBF Ahokokro%'
RETURNING *;

-- 5. VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nb_recettes_restantes,
    COUNT(CASE WHEN description LIKE '%PBF Ahokokro%' THEN 1 END) as nb_ahokokro_restantes
FROM recettes;
