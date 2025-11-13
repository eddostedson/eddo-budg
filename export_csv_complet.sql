-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 EXPORT CSV COMPLET POUR ANALYSE EXTERNE
-- ═══════════════════════════════════════════════════════════════════════════
-- Exécutez ces requêtes une par une et copiez les résultats dans Excel/Sheets
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 📋 EXPORT 1 : TOUTES LES RECETTES
-- ═══════════════════════════════════════════════════════════════════════════
-- À copier dans un fichier Excel/Sheets nommé "RECETTES"
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    id as "ID Recette",
    description as "Description",
    amount as "Montant",
    solde_disponible as "Solde Disponible",
    (amount - solde_disponible) as "Total Dépenses Calculé",
    receipt_date as "Date Recette",
    TO_CHAR(receipt_date, 'YYYY-MM') as "Mois",
    created_at as "Créée le"
FROM recettes
ORDER BY receipt_date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 💸 EXPORT 2 : TOUTES LES DÉPENSES
-- ═══════════════════════════════════════════════════════════════════════════
-- À copier dans un fichier Excel/Sheets nommé "DEPENSES"
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    id as "ID Dépense",
    libelle as "Libellé",
    montant as "Montant",
    date as "Date",
    recette_id as "ID Recette Liée",
    description as "Description",
    categorie as "Catégorie",
    TO_CHAR(date, 'YYYY-MM') as "Mois",
    created_at as "Créée le",
    CASE 
        WHEN recette_id IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as "Est Liée?"
FROM depenses
ORDER BY date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 🔗 EXPORT 3 : VUE COMBINÉE (Recettes + Dépenses liées)
-- ═══════════════════════════════════════════════════════════════════════════
-- À copier dans un fichier Excel/Sheets nommé "VUE_COMBINEE"
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    r.id as "ID Recette",
    r.description as "Recette",
    r.amount as "Montant Recette",
    r.solde_disponible as "Solde Disponible",
    (r.amount - r.solde_disponible) as "Dépenses Attendues",
    d.id as "ID Dépense",
    d.libelle as "Dépense",
    d.montant as "Montant Dépense",
    d.date as "Date Dépense",
    CASE 
        WHEN d.recette_id IS NOT NULL THEN 'OUI'
        ELSE 'NON'
    END as "Liaison Actuelle"
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
ORDER BY r.receipt_date DESC, d.date DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 📊 EXPORT 4 : RÉSUMÉ PAR RECETTE
-- ═══════════════════════════════════════════════════════════════════════════
-- À copier dans un fichier Excel/Sheets nommé "RESUME"
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
    r.id as "ID Recette",
    r.description as "Recette",
    r.amount as "Montant",
    r.solde_disponible as "Solde",
    (r.amount - r.solde_disponible) as "Dépenses Attendues",
    COUNT(d.id) as "Nb Dépenses Liées",
    COALESCE(SUM(d.montant), 0) as "Total Dépenses Liées",
    (r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0) as "Écart",
    CASE 
        WHEN ABS((r.amount - r.solde_disponible) - COALESCE(SUM(d.montant), 0)) < 1 THEN 'PARFAIT'
        WHEN COALESCE(SUM(d.montant), 0) = 0 THEN 'AUCUNE LIAISON'
        ELSE 'ECART DETECTE'
    END as "Statut"
FROM recettes r
LEFT JOIN depenses d ON d.recette_id = r.id
GROUP BY r.id, r.description, r.amount, r.solde_disponible
ORDER BY r.receipt_date DESC;


