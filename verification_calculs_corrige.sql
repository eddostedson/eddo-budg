-- 🔍 VÉRIFICATION CORRIGÉE DES CALCULS - ARCHITECTURE DIRECTE
-- Script corrigé basé sur la structure réelle des tables

-- 1. VÉRIFICATION DE LA STRUCTURE COMPLÈTE
SELECT 
    'STRUCTURE RECETTES' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'recettes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VÉRIFICATION DE LA STRUCTURE COMPLÈTE DEPENSES
SELECT 
    'STRUCTURE DEPENSES' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'depenses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VÉRIFICATION DES TOTAUX GLOBAUX RECETTES
SELECT 
    'TOTAUX RECETTES' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as total_solde_disponible
FROM recettes;

-- 4. VÉRIFICATION DES TOTAUX GLOBAUX DEPENSES
SELECT 
    'TOTAUX DEPENSES' as info,
    COUNT(*) as nombre_depenses,
    SUM(montant) as total_depenses
FROM depenses;

-- 5. VÉRIFICATION MATHÉMATIQUE FINALE
SELECT 
    'VÉRIFICATION MATHÉMATIQUE' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses_reelles,
    (SELECT SUM(solde_disponible) FROM recettes) as total_solde_disponible,
    ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses)) as solde_calcule,
    ((SELECT SUM(solde_disponible) FROM recettes) - ((SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses))) as difference_finale;
