-- 🔒 VÉRIFIER LES POLITIQUES RLS (ROW LEVEL SECURITY) SUR LA TABLE RECETTES
-- Exécutez cette requête dans Supabase SQL Editor

-- 1️⃣ Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'recettes';

-- 2️⃣ Voir toutes les politiques RLS existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'recettes';

-- 3️⃣ Si aucune politique INSERT n'existe, créez-en une :
-- ⚠️ DÉCOMMENTEZ CETTE LIGNE SI NÉCESSAIRE
/*
CREATE POLICY "Users can insert their own recettes" 
ON recettes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
*/

-- 4️⃣ Vérifier que l'utilisateur peut insérer (TEST)
-- ⚠️ REMPLACEZ 'YOUR_USER_ID' par votre vrai user_id
/*
SET request.jwt.claims TO '{"sub": "YOUR_USER_ID"}';

INSERT INTO recettes (
    user_id,
    libelle,
    description,
    amount,
    solde_disponible,
    receipt_date,
    statut
) VALUES (
    'YOUR_USER_ID',
    'Test RLS',
    'Test des permissions',
    10000,
    10000,
    CURRENT_DATE,
    'Reçue'
) RETURNING *;
*/

-- 5️⃣ Si vous voulez temporairement DÉSACTIVER RLS pour tester :
-- ⚠️ NE FAITES CECI QU'EN DÉVELOPPEMENT !
/*
ALTER TABLE recettes DISABLE ROW LEVEL SECURITY;
*/

-- 6️⃣ Pour RÉACTIVER RLS après test :
/*
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
*/

