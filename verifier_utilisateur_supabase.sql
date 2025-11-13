-- 🔍 VÉRIFIER LES UTILISATEURS DANS SUPABASE
-- Exécutez cette requête dans Supabase SQL Editor

-- 1️⃣ Afficher tous les utilisateurs inscrits
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- 2️⃣ Vérifier si votre email existe
-- (Remplacez 'votre@email.com' par votre email)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'votre@email.com';

-- ⚠️ NOTE : Vous NE POUVEZ PAS voir les mots de passe (ils sont chiffrés)
-- Si vous avez oublié votre mot de passe, utilisez la fonctionnalité "Mot de passe oublié" dans l'app

