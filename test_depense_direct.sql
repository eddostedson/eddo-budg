-- Test direct d'insertion de dépense dans Supabase
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur actuel
SELECT 'Utilisateur actuel:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 2. Vérifier les recettes disponibles
SELECT 'Recettes disponibles:' as info;
SELECT id, libelle, montant, solde_disponible 
FROM recettes 
ORDER BY created_at DESC 
LIMIT 3;

-- 3. Vérifier la structure de la table depenses
SELECT 'Structure de la table depenses:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
ORDER BY ordinal_position;

-- 4. Tester l'insertion directe (remplacer les valeurs par des vraies)
-- DÉCOMMENTER ET MODIFIER LES VALEURS CI-DESSOUS :
/*
INSERT INTO depenses (
    user_id, 
    libelle, 
    montant, 
    date, 
    description,
    recette_id
) VALUES (
    (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1),
    'Test dépense directe',
    100.00,
    CURRENT_DATE,
    'Test depuis SQL Editor',
    (SELECT id FROM recettes ORDER BY created_at DESC LIMIT 1)
) RETURNING *;
*/

-- 5. Vérifier les dépenses existantes
SELECT 'Dépenses existantes:' as info;
SELECT 
    id,
    user_id,
    libelle,
    montant,
    date,
    budget_id,
    recette_id,
    created_at
FROM depenses 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Vérifier les contraintes et triggers
SELECT 'Contraintes et triggers:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'depenses'
ORDER BY tc.constraint_name;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'depenses';

