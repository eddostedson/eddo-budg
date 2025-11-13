-- 🔍 VÉRIFIER LA STRUCTURE RÉELLE DE LA TABLE RECETTES
-- Script pour identifier les colonnes qui existent réellement

-- 1. STRUCTURE COMPLÈTE DE LA TABLE RECETTES
SELECT 
    'STRUCTURE RÉELLE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES DONNÉES EXISTANTES (PREMIÈRES LIGNES)
SELECT 
    'DONNÉES EXISTANTES' as info,
    *
FROM recettes 
LIMIT 3;

-- 3. COMPTER LE NOMBRE DE RECETTES
SELECT 
    'NOMBRE TOTAL' as info,
    COUNT(*) as nombre_recettes
FROM recettes;





