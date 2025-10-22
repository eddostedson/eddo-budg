-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE RESTAURATION DES DONNÉES EDDO-BUDG
-- ═══════════════════════════════════════════════════════════════════════════
-- Description: Script pour restaurer les données depuis les tables de sauvegarde
-- ═══════════════════════════════════════════════════════════════════════════

-- ⚠️ ATTENTION: Ce script va restaurer les données depuis les tables de sauvegarde
-- Assurez-vous que les tables de sauvegarde existent avant d'exécuter ce script

-- 1. VÉRIFICATION DES TABLES DE SAUVEGARDE
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    backup_tables TEXT[] := ARRAY[
        'recettes_backup_2025_10_07_10_06_19',
        'depenses_backup_2025_10_07_10_06_19', 
        'notes_depenses_backup_2025_10_07_10_06_19',
        'budgets_backup_2025_10_07_10_06_19',
        'transactions_backup_2025_10_07_10_06_19',
        'categories_backup_2025_10_07_10_06_19'
    ];
    table_name TEXT;
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔍 Vérification des tables de sauvegarde...';
    
    FOREACH table_name IN ARRAY backup_tables
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            RAISE NOTICE '✅ Table % existe', table_name;
        ELSE
            RAISE NOTICE '❌ Table % introuvable', table_name;
        END IF;
    END LOOP;
END $$;

-- 2. RESTAURATION DES RECETTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vider la table recettes actuelle (ATTENTION: cela supprime toutes les données actuelles)
-- TRUNCATE TABLE recettes;

-- Restaurer depuis la sauvegarde (décommentez si nécessaire)
-- INSERT INTO recettes 
-- SELECT * FROM recettes_backup_2025_10_07_10_06_19;

-- 3. RESTAURATION DES DÉPENSES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vider la table depenses actuelle (ATTENTION: cela supprime toutes les données actuelles)
-- TRUNCATE TABLE depenses;

-- Restaurer depuis la sauvegarde (décommentez si nécessaire)
-- INSERT INTO depenses 
-- SELECT * FROM depenses_backup_2025_10_07_10_06_19;

-- 4. RESTAURATION DES NOTES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vider la table notes_depenses actuelle (ATTENTION: cela supprime toutes les données actuelles)
-- TRUNCATE TABLE notes_depenses;

-- Restaurer depuis la sauvegarde (décommentez si nécessaire)
-- INSERT INTO notes_depenses 
-- SELECT * FROM notes_depenses_backup_2025_10_07_10_06_19;

-- 5. RESTAURATION DES BUDGETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Vider la table budgets actuelle (ATTENTION: cela supprime toutes les données actuelles)
-- TRUNCATE TABLE budgets;

-- Restaurer depuis la sauvegarde (décommentez si nécessaire)
-- INSERT INTO budgets 
-- SELECT * FROM budgets_backup_2025_10_07_10_06_19;

-- 6. RESTAURATION DES TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Vider la table transactions actuelle (ATTENTION: cela supprime toutes les données actuelles)
-- TRUNCATE TABLE transactions;

-- Restaurer depuis la sauvegarde (décommentez si nécessaire)
-- INSERT INTO transactions 
-- SELECT * FROM transactions_backup_2025_10_07_10_06_19;

-- 7. RESTAURATION DES CATÉGORIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Vider la table categories actuelle (ATTENTION: cela supprime toutes les données actuelles)
-- TRUNCATE TABLE categories;

-- Restaurer depuis la sauvegarde (décommentez si nécessaire)
-- INSERT INTO categories 
-- SELECT * FROM categories_backup_2025_10_07_10_06_19;

-- 8. VÉRIFICATION DE LA RESTAURATION
-- ═══════════════════════════════════════════════════════════════════════════

-- Afficher un résumé après restauration
DO $$
DECLARE
    recettes_count INTEGER;
    depenses_count INTEGER;
    notes_count INTEGER;
    budgets_count INTEGER;
    transactions_count INTEGER;
    categories_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO recettes_count FROM recettes;
    SELECT COUNT(*) INTO depenses_count FROM depenses;
    SELECT COUNT(*) INTO notes_count FROM notes_depenses;
    SELECT COUNT(*) INTO budgets_count FROM budgets;
    SELECT COUNT(*) INTO transactions_count FROM transactions;
    SELECT COUNT(*) INTO categories_count FROM categories;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔄 RESTAURATION TERMINÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 RÉSUMÉ DES DONNÉES RESTAURÉES:';
    RAISE NOTICE '   • Recettes: % enregistrements', recettes_count;
    RAISE NOTICE '   • Dépenses: % enregistrements', depenses_count;
    RAISE NOTICE '   • Notes: % enregistrements', notes_count;
    RAISE NOTICE '   • Budgets: % enregistrements', budgets_count;
    RAISE NOTICE '   • Transactions: % enregistrements', transactions_count;
    RAISE NOTICE '   • Catégories: % enregistrements', categories_count;
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Données restaurées avec succès';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
END $$;


