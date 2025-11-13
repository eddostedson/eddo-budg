-- 🔍 DIAGNOSTIC SIMPLE - CRÉATION DE RECETTES
-- Script simplifié pour identifier rapidement les problèmes

-- 1. VÉRIFIER LA STRUCTURE DE BASE
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- 2. VÉRIFIER LES DONNÉES EXISTANTES
SELECT 
    COUNT(*) as nombre_recettes,
    MIN(created_at) as premiere_recette,
    MAX(created_at) as derniere_recette
FROM recettes;

-- 3. TESTER UNE INSERTION (SANS COMMIT)
BEGIN;
INSERT INTO recettes (user_id, libelle, montant, solde_disponible, statut)
VALUES (
    auth.uid(),
    'TEST DIAGNOSTIC SIMPLE',
    1000.00,
    1000.00,
    'reçue'
);
-- Annuler pour ne pas créer de vraie recette
ROLLBACK;

-- 4. VÉRIFIER LES POLITIQUES RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'recettes';

-- 5. VÉRIFIER LES TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'recettes';





