-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 EXTRACTION COMPLÈTE DES DONNÉES BRUTES
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce script extrait TOUTES les données de recettes et dépenses
-- pour analyse et correction manuelle si nécessaire
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 1. STRUCTURE DE LA TABLE RECETTES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '📋 STRUCTURE TABLE RECETTES' as titre;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'recettes'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 2. STRUCTURE DE LA TABLE DEPENSES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '📋 STRUCTURE TABLE DEPENSES' as titre;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'depenses'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 3. TOUTES LES RECETTES (DONNÉES BRUTES)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '💰 TOUTES LES RECETTES' as titre;

SELECT 
    id,
    description,
    amount as montant,
    solde_disponible,
    (amount - solde_disponible) as total_depenses_calculé,
    receipt_date as date_recette,
    created_at,
    user_id
FROM recettes
ORDER BY receipt_date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💸 4. TOUTES LES DÉPENSES (DONNÉES BRUTES)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '💸 TOUTES LES DÉPENSES' as titre;

SELECT 
    id,
    libelle,
    montant,
    date as date_depense,
    description,
    recette_id,
    categorie,
    created_at,
    user_id,
    CASE 
        WHEN recette_id IS NOT NULL THEN '✅ LIÉE'
        ELSE '❌ NON LIÉE'
    END as statut_liaison
FROM depenses
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔍 5. VÉRIFIER SI recette_id EXISTE DANS LA TABLE DEPENSES
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '🔍 VÉRIFICATION COLONNE recette_id' as titre;

SELECT 
    COUNT(*) as total_depenses,
    COUNT(recette_id) as depenses_avec_recette_id,
    COUNT(*) - COUNT(recette_id) as depenses_sans_recette_id,
    ROUND(COUNT(recette_id) * 100.0 / NULLIF(COUNT(*), 0), 2) as pourcentage_liees
FROM depenses;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔗 6. DÉPENSES AVEC recette_id (SI ELLES EXISTENT)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '🔗 DÉPENSES DÉJÀ LIÉES' as titre;

SELECT 
    d.id,
    d.libelle as depense,
    d.montant,
    d.recette_id,
    r.description as recette_associee,
    r.amount as montant_recette,
    CASE 
        WHEN r.id IS NOT NULL THEN '✅ RECETTE EXISTE'
        ELSE '❌ RECETTE INTROUVABLE'
    END as validite
FROM depenses d
LEFT JOIN recettes r ON d.recette_id = r.id
WHERE d.recette_id IS NOT NULL
ORDER BY d.date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 7. RÉSUMÉ PAR RECETTE AVEC CALCULS
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '📊 RÉSUMÉ PAR RECETTE' as titre;

SELECT 
    r.id,
    r.description as recette,
    r.amount as montant_recette,
    r.solde_disponible,
    (r.amount - r.solde_disponible) as depenses_attendues,
    COALESCE(SUM(d.montant), 0) as depenses_liees_actuellement,
    COUNT(d.id) as nb_depenses_liees,
    (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as ecart,
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1 THEN '✅ PARFAIT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 THEN '⚠️ AUCUNE DÉPENSE LIÉE'
        ELSE '❌ ÉCART DÉTECTÉ'
    END as statut
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.receipt_date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🎯 8. EXPORT JSON POUR SAUVEGARDE
-- ═══════════════════════════════════════════════════════════════════════════
SELECT 
    '══════════════════════════════════════' as separateur,
    '💾 EXPORT JSON - RECETTES' as titre;

SELECT json_agg(row_to_json(t))
FROM (
    SELECT 
        id,
        description,
        amount,
        solde_disponible,
        receipt_date,
        created_at,
        updated_at,
        user_id
    FROM recettes
    ORDER BY receipt_date DESC
) t;

SELECT 
    '══════════════════════════════════════' as separateur,
    '💾 EXPORT JSON - DÉPENSES' as titre;

SELECT json_agg(row_to_json(t))
FROM (
    SELECT 
        id,
        libelle,
        montant,
        date,
        description,
        recette_id,
        categorie,
        created_at,
        updated_at,
        user_id
    FROM depenses
    ORDER BY date DESC
) t;


