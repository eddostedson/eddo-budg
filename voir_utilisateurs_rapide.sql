-- 🔍 VOIR VOS UTILISATEURS SUPABASE
-- Exécutez cette requête dans Supabase SQL Editor

SELECT 
    email,
    created_at as "inscrit_le",
    last_sign_in_at as "derniere_connexion",
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmé'
        ELSE '⚠️ Non confirmé'
    END as "statut_email"
FROM auth.users
ORDER BY created_at DESC;

-- 📝 NOTE : Si vous avez oublié votre mot de passe :
-- 1. Cliquez sur "Mot de passe oublié" dans l'application
-- 2. Ou créez un nouveau compte avec un autre email

