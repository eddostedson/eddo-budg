-- Script de nettoyage pour supprimer les tables inutilisées
-- Ce script supprime la table 'expenses' qui n'est pas utilisée

-- 1. Vérifier l'existence de la table expenses
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'expenses'
) AS expenses_table_exists;

-- 2. Vérifier s'il y a des données dans la table expenses
SELECT COUNT(*) AS expenses_count FROM expenses;

-- 3. Supprimer la table expenses si elle existe (elle n'est pas utilisée)
DROP TABLE IF EXISTS expenses CASCADE;

-- 4. Vérifier que la table a été supprimée
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'expenses'
) AS expenses_table_exists_after;

-- 5. Lister les tables restantes pour vérification
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('recettes', 'depenses', 'budgets', 'categories', 'transactions', 'transferts')
ORDER BY table_name;

-- Message de confirmation
SELECT 'Nettoyage terminé. Table expenses supprimée.' AS status;



























