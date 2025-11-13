-- Script de diagnostic pour la table depenses
-- Vérifier la structure et les contraintes

-- 1. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'depenses';

-- 3. Vérifier les données existantes
SELECT 
    id,
    user_id,
    budget_id,
    recette_id,
    libelle,
    montant,
    date,
    created_at
FROM depenses 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'depenses';


































