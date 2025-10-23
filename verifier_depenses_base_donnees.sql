-- 🔍 VÉRIFIER LES DÉPENSES EN BASE DE DONNÉES
-- À exécuter dans Supabase SQL Editor

-- 1. COMPTER TOUTES LES DÉPENSES
SELECT 
    'TOTAL DÉPENSES EN BASE' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_montant
FROM depenses;

-- 2. AFFICHER LES 10 DERNIÈRES DÉPENSES
SELECT 
    'DERNIÈRES DÉPENSES' as info,
    id,
    libelle,
    montant,
    date,
    created_at,
    updated_at
FROM depenses 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. VÉRIFIER LES DÉPENSES D'AUJOURD'HUI
SELECT 
    'DÉPENSES D\'AUJOURD\'HUI' as info,
    COUNT(*) as nb_depenses_aujourd_hui,
    SUM(montant) as total_aujourd_hui
FROM depenses 
WHERE DATE(created_at) = CURRENT_DATE;

-- 4. VÉRIFIER LES DÉPENSES LIÉES À PBF AHOKOKRO
SELECT 
    'DÉPENSES PBF AHOKOKRO' as info,
    d.id,
    d.libelle,
    d.montant,
    d.date,
    d.created_at,
    r.description as recette_source
FROM depenses d
JOIN recettes r ON d.recette_id = r.id
WHERE r.description LIKE '%PBF Ahokokro%'
ORDER BY d.created_at DESC;
