-- Script de test pour l'insertion de dépenses
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier qu'il y a des recettes disponibles
SELECT 'Recettes disponibles:' as info;
SELECT id, libelle, montant, solde_disponible 
FROM recettes 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. Vérifier qu'il y a un utilisateur connecté
SELECT 'Utilisateur actuel:' as info;
SELECT id, email 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 1;

-- 3. Tester l'insertion d'une dépense (remplacer les valeurs par des vraies)
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
    'Test dépense depuis SQL',
    50.00,
    CURRENT_DATE,
    'Description de test',
    (SELECT id FROM recettes ORDER BY created_at DESC LIMIT 1)
) RETURNING *;
*/

-- 4. Vérifier les dépenses existantes
SELECT 'Dépenses existantes:' as info;
SELECT 
    id,
    libelle,
    montant,
    date,
    budget_id,
    recette_id,
    created_at
FROM depenses 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Vérifier les contraintes de la table
SELECT 'Contraintes de la table depenses:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'depenses'
ORDER BY tc.constraint_name;

