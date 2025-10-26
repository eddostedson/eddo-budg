-- Vérifier les politiques RLS de la table depenses

-- 1. Vérifier si RLS est activé
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'depenses';

-- 2. Voir les politiques existantes
SELECT 
    policyname as policy_name,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'depenses';

-- 3. Solution: Créer les politiques RLS si elles n'existent pas
-- DÉCOMMENTER CI-DESSOUS POUR APPLIQUER

-- -- Activer RLS
-- ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

-- -- Politique pour voir ses propres dépenses
-- DROP POLICY IF EXISTS "Users can view own depenses" ON depenses;
-- CREATE POLICY "Users can view own depenses"
-- ON depenses FOR SELECT
-- USING (auth.uid() = user_id);

-- -- Politique pour créer ses propres dépenses
-- DROP POLICY IF EXISTS "Users can create own depenses" ON depenses;
-- CREATE POLICY "Users can create own depenses"
-- ON depenses FOR INSERT
-- WITH CHECK (auth.uid() = user_id);

-- -- Politique pour modifier ses propres dépenses
-- DROP POLICY IF EXISTS "Users can update own depenses" ON depenses;
-- CREATE POLICY "Users can update own depenses"
-- ON depenses FOR UPDATE
-- USING (auth.uid() = user_id);

-- -- Politique pour supprimer ses propres dépenses
-- DROP POLICY IF EXISTS "Users can delete own depenses" ON depenses;
-- CREATE POLICY "Users can delete own depenses"
-- ON depenses FOR DELETE
-- USING (auth.uid() = user_id);



































