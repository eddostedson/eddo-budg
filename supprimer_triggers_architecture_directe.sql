-- 🚀 ARCHITECTURE DIRECTE - SUPPRESSION DES TRIGGERS PROBLÉMATIQUES
-- Éliminer tous les triggers qui modifient automatiquement les données

-- 1. Supprimer les triggers sur la table 'allocations'
DROP TRIGGER IF EXISTS trigger_update_recette_solde ON allocations;

-- 2. Supprimer les triggers sur la table 'depenses_original'
DROP TRIGGER IF EXISTS trigger_deduire_solde_recette ON depenses_original;

-- 3. Supprimer les triggers sur la table 'transferts'
DROP TRIGGER IF EXISTS trigger_decrementer_solde_recette ON transferts;
DROP TRIGGER IF EXISTS trigger_incrementer_solde_recette ON transferts;

-- 4. Supprimer les fonctions associées (si elles ne sont plus utilisées ailleurs)
DROP FUNCTION IF EXISTS update_recette_solde();
DROP FUNCTION IF EXISTS deduire_solde_recette();
DROP FUNCTION IF EXISTS decrementer_solde_recette();
DROP FUNCTION IF EXISTS incrementer_solde_recette();

-- 5. Vérifier que les triggers et fonctions ont été supprimés
SELECT
    'TRIGGERS RESTANTS' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
    'trigger_update_recette_solde',
    'trigger_deduire_solde_recette',
    'trigger_decrementer_solde_recette',
    'trigger_incrementer_solde_recette'
);

SELECT
    'FONCTIONS RESTANTES' as info,
    routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'update_recette_solde',
    'deduire_solde_recette',
    'decrementer_solde_recette',
    'incrementer_solde_recette'
);

-- 6. Recalculer les soldes disponibles correctement
UPDATE recettes 
SET solde_disponible = (
    SELECT r.amount - COALESCE(SUM(d.montant), 0)
    FROM recettes r
    LEFT JOIN depenses d ON r.id = d.recette_id
    WHERE r.id = recettes.id
    GROUP BY r.id, r.amount
),
updated_at = NOW();

-- 7. Vérification finale
SELECT 
    'VÉRIFICATION FINALE' as info,
    COUNT(*) as nombre_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as total_solde_disponible,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calcule
FROM recettes;
