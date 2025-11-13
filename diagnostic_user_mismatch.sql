-- 🔍 DIAGNOSTIC: Problème d'affichage des recettes (Total 0 F CFA)
-- Ce script vérifie si le problème vient d'un décalage entre l'utilisateur connecté et les recettes

-- ========================================
-- 1. VÉRIFIER TOUS LES UTILISATEURS
-- ========================================
SELECT 
    '1. TOUS LES UTILISATEURS' as section,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- ========================================
-- 2. VÉRIFIER TOUTES LES RECETTES ET LEURS USER_ID
-- ========================================
SELECT 
    '2. TOUTES LES RECETTES (sans RLS)' as section,
    id,
    user_id,
    description,
    amount,
    solde_disponible,
    created_at
FROM recettes
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- 3. COMPTER LES RECETTES PAR UTILISATEUR
-- ========================================
SELECT 
    '3. RECETTES PAR UTILISATEUR' as section,
    r.user_id,
    u.email as user_email,
    COUNT(*) as nombre_recettes,
    SUM(r.amount) as total_amount,
    SUM(r.solde_disponible) as total_solde_disponible
FROM recettes r
LEFT JOIN auth.users u ON r.user_id = u.id
GROUP BY r.user_id, u.email
ORDER BY nombre_recettes DESC;

-- ========================================
-- 4. VÉRIFIER LES POLITIQUES RLS
-- ========================================
SELECT 
    '4. POLITIQUES RLS ACTIVES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as condition
FROM pg_policies 
WHERE tablename = 'recettes';

-- ========================================
-- 5. STATISTIQUES GLOBALES
-- ========================================
SELECT 
    '5. STATISTIQUES' as section,
    'Total recettes' as metric,
    COUNT(*) as valeur,
    SUM(amount) as montant_total,
    SUM(solde_disponible) as solde_total
FROM recettes;

-- ========================================
-- RECOMMANDATIONS
-- ========================================
-- Si vous voyez plusieurs utilisateurs, le problème est probablement que :
-- - L'utilisateur connecté dans l'app (eddostedson@gmail.com) 
--   n'est PAS le même que celui qui a créé les recettes dans la base
-- 
-- SOLUTIONS POSSIBLES :
-- 
-- A. SE CONNECTER AVEC LE BON COMPTE
--    Déconnectez-vous et reconnectez-vous avec l'email qui apparaît dans user_email
-- 
-- B. RÉASSIGNER LES RECETTES AU BON UTILISATEUR
--    Exécutez le script suivant pour réassigner toutes les recettes à l'utilisateur connecté
--    (Remplacez NEW_USER_ID par l'ID du bon utilisateur)
--
-- UPDATE recettes 
-- SET user_id = 'NEW_USER_ID'
-- WHERE user_id = 'OLD_USER_ID';



