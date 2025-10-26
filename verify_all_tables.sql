-- ═══════════════════════════════════════════════════════════════════════════
-- SCRIPT DE VÉRIFICATION COMPLÈTE DE TOUTES LES TABLES
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Ce script vérifie l'existence de toutes les tables requises par l'application
-- et affiche un rapport détaillé
--
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    tables_required TEXT[] := ARRAY['budgets', 'recettes', 'depenses', 'allocations', 'transferts', 'notes_depenses', 'budget_recettes', 'budget_depenses'];
    table_name TEXT;
    table_exists BOOLEAN;
    col_count INTEGER;
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    existing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '🔍 VÉRIFICATION COMPLÈTE DES TABLES DE LA BASE DE DONNÉES';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier chaque table requise
    FOREACH table_name IN ARRAY tables_required
    LOOP
        -- Vérifier si la table existe
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND tables.table_name = table_name
        ) INTO table_exists;
        
        IF table_exists THEN
            -- Compter les colonnes
            SELECT COUNT(*) INTO col_count
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND columns.table_name = table_name;
            
            RAISE NOTICE '✅ % existe (%s colonnes)', RPAD(table_name, 20), col_count;
            existing_tables := array_append(existing_tables, table_name);
        ELSE
            RAISE NOTICE '❌ % N''EXISTE PAS !', RPAD(table_name, 20);
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '─────────────────────────────────────────────────────────────────────────';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSUMÉ :';
    RAISE NOTICE '   • Tables existantes : %s / %s', array_length(existing_tables, 1), array_length(tables_required, 1);
    RAISE NOTICE '   • Tables manquantes : %s', COALESCE(array_length(missing_tables, 1), 0);
    RAISE NOTICE '';
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  TABLES MANQUANTES :';
        FOREACH table_name IN ARRAY missing_tables
        LOOP
            RAISE NOTICE '   • %', table_name;
        END LOOP;
        RAISE NOTICE '';
        RAISE NOTICE '🔧 ACTIONS REQUISES :';
        RAISE NOTICE '';
        
        -- Recommandations spécifiques
        IF 'budgets' = ANY(missing_tables) THEN
            RAISE NOTICE '   1. Exécuter : supabase/migrations/008_reintroduce_budgets_as_projects_CLEAN.sql';
        END IF;
        
        IF 'recettes' = ANY(missing_tables) THEN
            RAISE NOTICE '   2. Exécuter : supabase/migrations/005_create_recettes_depenses.sql';
        END IF;
        
        IF 'depenses' = ANY(missing_tables) THEN
            RAISE NOTICE '   3. Exécuter : supabase/migrations/000_diagnostic_and_fix_depenses.sql';
        END IF;
        
        IF 'transferts' = ANY(missing_tables) THEN
            RAISE NOTICE '   4. Exécuter : supabase/migrations/012_create_transferts_table.sql';
        END IF;
        
        IF 'notes_depenses' = ANY(missing_tables) THEN
            RAISE NOTICE '   5. Exécuter : supabase/migrations/013_create_notes_table.sql';
        END IF;
    ELSE
        RAISE NOTICE '🎉 TOUTES LES TABLES REQUISES SONT PRÉSENTES !';
        RAISE NOTICE '';
        RAISE NOTICE '✨ Votre base de données est complète et prête à l''emploi.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- DÉTAILS DES COLONNES DE CHAQUE TABLE
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    rec RECORD;
    current_table TEXT := '';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '📋 DÉTAIL DES COLONNES DE CHAQUE TABLE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    FOR rec IN (
        SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('budgets', 'recettes', 'depenses', 'allocations', 'transferts', 'notes_depenses')
        ORDER BY t.table_name, c.ordinal_position
    ) LOOP
        -- Afficher le nom de la table si elle change
        IF rec.table_name <> current_table THEN
            IF current_table <> '' THEN
                RAISE NOTICE '';
            END IF;
            RAISE NOTICE '📊 Table : %', UPPER(rec.table_name);
            RAISE NOTICE '─────────────────────────────────────────────────────────────────────────';
            current_table := rec.table_name;
        END IF;
        
        RAISE NOTICE '   • % (%) %', 
            RPAD(rec.column_name, 25), 
            RPAD(rec.data_type, 20),
            CASE WHEN rec.is_nullable = 'NO' THEN 'NOT NULL' ELSE '' END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
END $$;













