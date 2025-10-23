-- Diagnostic de PBF Ahokokro
-- À exécuter dans Supabase SQL Editor

-- 1. RECHERCHER TOUTES LES VARIATIONS DE PBF Ahokokro
SELECT 
    'RECHERCHE PBF Ahokokro' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.user_id,
    r.created_at
FROM recettes r
WHERE r.description ILIKE '%ahokokro%'
   OR r.description ILIKE '%pbf%'
ORDER BY r.created_at DESC;

-- 2. LISTER TOUTES LES RECETTES POUR IDENTIFIER LE PROBLÈME
SELECT 
    'TOUTES LES RECETTES' as info,
    r.id,
    r.description as libelle,
    r.amount as montant,
    r.created_at
FROM recettes r
ORDER BY r.created_at DESC;

-- 3. COMPTER LES RECETTES PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes
FROM recettes
GROUP BY user_id
ORDER BY nb_recettes DESC;
