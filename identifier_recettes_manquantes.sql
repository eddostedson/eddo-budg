-- 🔍 IDENTIFIER LES RECETTES MANQUANTES DANS L'APPLICATION
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES RECETTES LES PLUS RÉCENTES (DERNIÈRES 8)
SELECT 
    'DERNIÈRES 8 RECETTES (CELLES QUI S'AFFICHENT)' as info,
    description,
    amount,
    created_at
FROM recettes 
ORDER BY created_at DESC
LIMIT 8;

-- 2. VÉRIFIER LES RECETTES LES PLUS ANCIENNES (CELLES QUI NE S'AFFICHENT PAS)
SELECT 
    'RECETTES ANCIENNES (MANQUANTES)' as info,
    description,
    amount,
    created_at
FROM recettes 
ORDER BY created_at ASC
LIMIT 3;

-- 3. VÉRIFIER LES RECETTES PAR MONTANT (TRIÉES)
SELECT 
    'RECETTES PAR MONTANT' as info,
    description,
    amount,
    created_at
FROM recettes 
ORDER BY amount DESC;

-- 4. VÉRIFIER LES RECETTES PAR UTILISATEUR
SELECT 
    'RECETTES PAR UTILISATEUR' as info,
    user_id,
    COUNT(*) as nb_recettes
FROM recettes 
GROUP BY user_id
ORDER BY nb_recettes DESC;
