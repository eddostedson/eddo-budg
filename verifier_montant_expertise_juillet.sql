-- VÉRIFIER LE MONTANT DE LA RECETTE EXPERTISE JUILLET 2025
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LE MONTANT ACTUEL DE LA RECETTE
SELECT 
    'RECETTE EXPERTISE JUILLET 2025' as info,
    id,
    description,
    amount as montant_actuel,
    created_at,
    updated_at
FROM recettes 
WHERE description = 'EXPERTISE : Budget de Fonctionnement Juillet 2025';

-- 2. VÉRIFIER TOUTES LES RECETTES EXPERTISE
SELECT 
    'TOUTES LES RECETTES EXPERTISE' as info,
    id,
    description,
    amount as montant_actuel,
    created_at,
    updated_at
FROM recettes 
WHERE description LIKE '%EXPERTISE%'
ORDER BY description;

-- 3. COMPARER AVEC LE CSV
-- CSV: 462,000.00 FCFA
-- Base: ? FCFA
SELECT 
    'COMPARAISON CSV vs BASE' as info,
    'CSV' as source,
    '462,000.00' as montant_csv,
    'Base de données' as source_base,
    amount as montant_base,
    CASE 
        WHEN amount = 462000.00 THEN '✅ CORRECT'
        WHEN amount = 46200.00 THEN '🚨 DIVISÉ PAR 10'
        WHEN amount = 4620.00 THEN '🚨 DIVISÉ PAR 100'
        ELSE '⚠️ AUTRE VALEUR'
    END as statut
FROM recettes 
WHERE description = 'EXPERTISE : Budget de Fonctionnement Juillet 2025';
