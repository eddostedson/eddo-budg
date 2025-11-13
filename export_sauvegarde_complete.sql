-- ═══════════════════════════════════════════════════════════════════════════
-- 💾 EXPORT COMPLET DE TOUTES LES DONNÉES - SAUVEGARDE TOTALE
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ce script dans Supabase
-- Copiez les résultats JSON dans des fichiers locaux
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 1. EXPORT RECETTES (à copier dans recettes_backup.json)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT json_agg(row_to_json(t)) as recettes_export
FROM (
    SELECT 
        id,
        user_id,
        description,
        amount,
        solde_disponible,
        receipt_date,
        receipt_url,
        receipt_file_name,
        statut,
        created_at,
        updated_at
    FROM recettes
    ORDER BY receipt_date DESC
) t;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💸 2. EXPORT DÉPENSES (à copier dans depenses_backup.json)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT json_agg(row_to_json(t)) as depenses_export
FROM (
    SELECT 
        id,
        user_id,
        recette_id,
        libelle,
        montant,
        date,
        description,
        categorie,
        receipt_url,
        receipt_file_name,
        created_at,
        updated_at
    FROM depenses
    ORDER BY date DESC
) t;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 3. STATISTIQUES DE LA SAUVEGARDE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    '💾 STATISTIQUES DE SAUVEGARDE' as titre,
    (SELECT COUNT(*) FROM recettes) as nb_recettes,
    (SELECT COUNT(*) FROM depenses) as nb_depenses,
    (SELECT SUM(amount) FROM recettes) as total_recettes,
    (SELECT SUM(montant) FROM depenses) as total_depenses,
    NOW() as date_sauvegarde;


