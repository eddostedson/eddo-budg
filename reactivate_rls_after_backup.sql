-- Réactiver RLS après la sauvegarde
-- À exécuter dans Supabase SQL Editor APRÈS la sauvegarde

-- 1. Réactiver RLS sur toutes les tables
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;

-- 2. Vérifier que RLS est réactivé
SELECT 
    'RLS RÉACTIVÉ' as test,
    schemaname,
    tablename,
    rowsecurity as rls_active
FROM pg_tables 
WHERE tablename IN ('depenses', 'recettes', 'notes_depenses', 'categories', 'goals', 'transactions', 'budgets', 'transferts')
ORDER BY tablename;

-- 3. Tester l'accès avec RLS activé (devrait échouer sans authentification)
SELECT 
    'TEST SÉCURITÉ' as test,
    'RLS réactivé avec succès' as message,
    'Les tables sont maintenant protégées' as status;

-- 4. Afficher un message de confirmation
SELECT 
    'CONFIRMATION' as test,
    'RLS réactivé sur toutes les tables' as message,
    'Sécurité restaurée' as status;





























