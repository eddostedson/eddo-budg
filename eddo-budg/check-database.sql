
-- Script SQL pour vérifier la base de données
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les utilisateurs
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email IN ('eddostedson@gmail.com', 'eddostedson+esss@gmail.com')
ORDER BY created_at DESC;

-- 2. Vérifier les budgets
SELECT 
  id,
  name,
  amount,
  type,
  user_id,
  created_at
FROM budgets 
ORDER BY created_at DESC;

-- 3. Vérifier les profils
SELECT 
  id,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 4. Recherche spécifique pour vos budgets
SELECT 
  b.*,
  u.email as user_email
FROM budgets b
LEFT JOIN auth.users u ON b.user_id = u.id
WHERE u.email IN ('eddostedson@gmail.com', 'eddostedson+esss@gmail.com')
ORDER BY b.created_at DESC;
