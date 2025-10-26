-- 🔍 DIAGNOSTIC CRÉATION DE RECETTES
-- Script pour diagnostiquer les problèmes de création de recettes

-- 1. VÉRIFIER LA STRUCTURE DE LA TABLE RECETTES
SELECT 
    'STRUCTURE TABLE RECETTES' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES CONTRAINTES DE LA TABLE
SELECT 
    'CONTRAINTES TABLE RECETTES' as info,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'recettes';

-- 3. VÉRIFIER LES TRIGGERS ACTIFS
SELECT 
    'TRIGGERS ACTIFS' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'recettes';

-- 4. TESTER UNE INSERTION SIMPLE (SANS COMMIT)
BEGIN;
INSERT INTO recettes (user_id, libelle, montant, solde_disponible, description, date_reception, statut)
VALUES (
    auth.uid(),
    'TEST DIAGNOSTIC',
    1000.00,
    1000.00,
    'Test de diagnostic',
    CURRENT_DATE,
    'reçue'
);
-- Ne pas commiter pour éviter de créer une vraie recette
ROLLBACK;

-- 5. VÉRIFIER LES POLITIQUES RLS
SELECT 
    'POLITIQUES RLS' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'recettes';

-- 6. VÉRIFIER LES DONNÉES EXISTANTES (LIMITÉES)
SELECT 
    'DONNÉES EXISTANTES' as info,
    id,
    libelle,
    montant,
    solde_disponible,
    statut,
    created_at
FROM recettes 
ORDER BY created_at DESC 
LIMIT 5;
