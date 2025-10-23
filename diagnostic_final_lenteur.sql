-- DIAGNOSTIC FINAL DE LA LENTEUR D'ENREGISTREMENT
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFIER LES TRIGGERS (CAUSE PRINCIPALE DE LENTEUR)
SELECT 
    '🔥 TRIGGERS DEPENSES' as info,
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement as fonction
FROM information_schema.triggers 
WHERE event_object_table = 'depenses'
ORDER BY trigger_name;

-- 2. VÉRIFIER LES FONCTIONS DÉCLENCHÉES
SELECT 
    '⚡ FONCTIONS TRIGGERS' as info,
    routine_name,
    routine_type,
    LEFT(routine_definition, 500) as definition_debut
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%depense%' OR routine_name LIKE '%recette%' OR routine_name LIKE '%solde%')
ORDER BY routine_name;

-- 3. VÉRIFIER LES POLITIQUES RLS (PEUVENT RALENTIR)
SELECT 
    '🔐 POLITIQUES RLS DEPENSES' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'depenses'
ORDER BY policyname;

-- 4. TEST D'INSERTION DIRECTE (SANS APPLICATION)
-- Ce test permet de mesurer la vitesse de la base de données elle-même
-- Décommentez pour tester :
/*
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    duration interval;
BEGIN
    start_time := clock_timestamp();
    
    -- Test d'insertion
    INSERT INTO depenses (user_id, libelle, montant, date, description)
    VALUES (
        (SELECT auth.uid()),
        'TEST PERFORMANCE',
        1000,
        CURRENT_DATE,
        'Test de performance direct'
    );
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    RAISE NOTICE 'Temps d''insertion: % ms', EXTRACT(MILLISECONDS FROM duration);
    
    -- Supprimer le test
    DELETE FROM depenses WHERE libelle = 'TEST PERFORMANCE';
END $$;
*/

-- 5. VÉRIFIER LA TAILLE DE LA TABLE
SELECT 
    '📊 TAILLE TABLE DEPENSES' as info,
    pg_size_pretty(pg_total_relation_size('depenses')) as taille_totale,
    pg_size_pretty(pg_relation_size('depenses')) as taille_table,
    (SELECT COUNT(*) FROM depenses) as nombre_lignes
FROM pg_tables 
WHERE tablename = 'depenses';

-- 6. AFFICHER LA STRUCTURE COMPLÈTE DE LA TABLE
SELECT 
    '📋 STRUCTURE TABLE DEPENSES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses'
ORDER BY ordinal_position;
