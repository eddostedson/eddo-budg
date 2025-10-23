-- Suppression définitive de PBF Ahokokro en base de données
-- À exécuter dans Supabase SQL Editor

-- 1. IDENTIFIER PBF Ahokokro
SELECT 
    'IDENTIFICATION PBF Ahokokro' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.user_id,
    r.created_at
FROM recettes r
WHERE r.description LIKE '%PBF Ahokokro%'
ORDER BY r.created_at DESC;

-- 2. SUPPRIMER LES DÉPENSES LIÉES (si elles existent)
DELETE FROM depenses 
WHERE recette_id IN (
    SELECT r.id 
    FROM recettes r 
    WHERE r.description LIKE '%PBF Ahokokro%'
);

-- 3. SUPPRIMER PBF Ahokokro
DELETE FROM recettes 
WHERE description LIKE '%PBF Ahokokro%'
RETURNING *;

-- 4. VÉRIFICATION FINALE
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nombre_recettes_restantes
FROM recettes;

-- 5. LISTER LES RECETTES RESTANTES
SELECT 
    'RECETTES RESTANTES' as info,
    r.description as libelle,
    r.amount as montant,
    r.created_at
FROM recettes r
ORDER BY r.created_at DESC;
