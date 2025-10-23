-- 🚨 SCRIPT DE SÉCURITÉ #1 - À EXÉCUTER IMMÉDIATEMENT
-- SUPPRIMER DÉFINITIVEMENT LES TRIGGERS PROBLÉMATIQUES
-- ⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !

-- 1. SUPPRIMER TOUS LES TRIGGERS QUI MODIFIENT LES MONTANTS
DROP TRIGGER IF EXISTS trigger_update_recette_solde ON allocations;
DROP TRIGGER IF EXISTS trigger_deduire_solde_recette ON depenses_original;
DROP TRIGGER IF EXISTS trigger_decrementer_solde_recette ON transferts;
DROP TRIGGER IF EXISTS trigger_incrementer_solde_recette ON transferts;

-- 2. SUPPRIMER LES FONCTIONS PROBLÉMATIQUES
DROP FUNCTION IF EXISTS update_recette_solde();
DROP FUNCTION IF EXISTS deduire_solde_recette();
DROP FUNCTION IF EXISTS decrementer_solde_recette();
DROP FUNCTION IF EXISTS incrementer_solde_recette();

-- 3. VÉRIFIER QUE TOUS LES TRIGGERS SONT SUPPRIMÉS
SELECT 
    'TRIGGERS RESTANTS' as info,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%solde%'
   OR action_statement LIKE '%recette%'
   OR action_statement LIKE '%amount%'
   OR action_statement LIKE '%montant%'
ORDER BY event_object_table, trigger_name;

-- 4. VÉRIFIER QUE TOUTES LES FONCTIONS SONT SUPPRIMÉES
SELECT 
    'FONCTIONS RESTANTES' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (routine_name LIKE '%recette%' 
       OR routine_name LIKE '%solde%'
       OR routine_name LIKE '%amount%'
       OR routine_name LIKE '%montant%')
ORDER BY routine_name;
