-- SURVEILLANCE QUOTIDIENNE DES MONTANTS
-- À exécuter quotidiennement dans Supabase SQL Editor

-- 1. VÉRIFICATION COMPLÈTE DES MONTANTS
SELECT 
    'SURVEILLANCE QUOTIDIENNE' as info,
    NOW() as date_verification,
    COUNT(*) as nb_recettes,
    SUM(amount) as total_recettes,
    SUM(solde_disponible) as total_solde_disponible,
    (SUM(amount) - SUM(solde_disponible)) as total_depenses_calculees,
    CASE 
        WHEN SUM(amount) = SUM(solde_disponible) + (SUM(amount) - SUM(solde_disponible)) THEN '✅ COHÉRENT'
        ELSE '🚨 INCOHÉRENT - ALERTE !'
    END as statut
FROM recettes;

-- 2. DÉTECTION DES MONTANTS SUSPECTS
SELECT 
    'MONTANTS SUSPECTS DÉTECTÉS' as info,
    description,
    amount,
    CASE 
        WHEN amount < 1000 AND description LIKE '%EXPERTISE%' THEN '🚨 CRITIQUE'
        WHEN amount < 10000 AND description LIKE '%BSIC%' THEN '🚨 CRITIQUE'
        WHEN amount < 10000 AND description LIKE '%REVERSEMENT%' THEN '🚨 CRITIQUE'
        WHEN amount < 10000 AND description LIKE '%LOYER%' THEN '⚠️ ATTENTION'
        ELSE '✅ NORMAL'
    END as niveau_alerte
FROM recettes 
WHERE amount < 10000
ORDER BY amount ASC;

-- 3. VÉRIFICATION DES CHANGEMENTS RÉCENTS
SELECT 
    'CHANGEMENTS RÉCENTS' as info,
    recette_id,
    old_amount,
    new_amount,
    change_reason,
    changed_at
FROM recette_change_log
WHERE changed_at >= NOW() - INTERVAL '24 hours'
ORDER BY changed_at DESC;

-- 4. VÉRIFICATION DES SAUVEGARDES
SELECT 
    'ÉTAT DES SAUVEGARDES' as info,
    COUNT(*) as nb_sauvegardes,
    MAX(backup_date) as derniere_sauvegarde,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Sauvegardes disponibles'
        ELSE '⚠️ Aucune sauvegarde'
    END as statut
FROM recettes_backup_auto;
