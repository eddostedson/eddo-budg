-- Vérifier le nombre exact de recettes
-- À exécuter dans Supabase SQL Editor

-- 1. COMPTER LES RECETTES
SELECT 
    'NOMBRE TOTAL DE RECETTES' as info,
    COUNT(*) as nombre_recettes
FROM recettes;

-- 2. LISTER TOUTES LES RECETTES
SELECT 
    'LISTE DES RECETTES' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.created_at
FROM recettes r
ORDER BY r.created_at DESC;

-- 3. VÉRIFIER PBF Ahokokro
SELECT 
    'VÉRIFICATION PBF Ahokokro' as info,
    COUNT(*) as nb_ahokokro,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PRÉSENT'
        ELSE 'ABSENT'
    END as statut
FROM recettes 
WHERE description LIKE '%PBF Ahokokro%';

-- 4. COMPTER PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes
FROM recettes
GROUP BY user_id
ORDER BY nb_recettes DESC;
