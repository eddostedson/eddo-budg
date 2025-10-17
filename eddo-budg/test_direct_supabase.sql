-- Test direct d'insertion dans Supabase
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'utilisateur actuel
SELECT 'Utilisateur actuel:' as info;
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- 2. Vérifier les recettes disponibles
SELECT 'Recettes disponibles:' as info;
SELECT id, libelle, montant FROM recettes ORDER BY created_at DESC LIMIT 3;

-- 3. Tester l'insertion directe (remplacer les valeurs)
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

-- 4. Vérifier que la dépense a été créée
SELECT 'Dépenses après insertion:' as info;
SELECT id, libelle, montant, recette_id, created_at 
FROM depenses 
ORDER BY created_at DESC 
LIMIT 5;







