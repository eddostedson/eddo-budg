-- TABLEAU DES MONTANTS CORRECTS BASÉS SUR LE CSV
-- À exécuter dans Supabase SQL Editor

-- 1. AFFICHER TOUTES LES RECETTES AVEC MONTANTS CORRECTS DU CSV
SELECT 
    'MONTANTS CORRECTS DU CSV' as info,
    description as recette,
    amount as montant_csv,
    'FCFA' as devise
FROM (
    VALUES 
    ('RELIQUAT PRET SUR REMISE -COMPTE BANCAIRE ACCD', 3980672.00),
    ('BSIC REVERSEMENT SUR PRECOMPTE : NUMERAIRE', 430000.00),
    ('Loyer Kennedy : Mois de Octobre 2025', 335000.00),
    ('EXPERTISE : Budget de Fonctionnement Juillet 2025', 462000.00),
    ('EXPERTISE : Budget de Fonctionnement Aout 2025', 500000.00),
    ('PBF Kongodjan', 20000.00),
    ('PBF Ahokokro', 100000.00),
    ('BSIC - SOLDE EXPERTISE', 1639219.00),
    ('Numeraire Recupéré sur ACCD', 245000.00),
    ('Salaire Septembre 2025', 270000.00)
) AS csv_data(description, amount)
ORDER BY amount DESC;

-- 2. COMPARER AVEC LA BASE DE DONNÉES ACTUELLE
SELECT 
    'COMPARAISON CSV vs BASE' as info,
    r.description as recette,
    csv.amount as montant_csv,
    r.amount as montant_base,
    (csv.amount - r.amount) as difference,
    CASE 
        WHEN csv.amount = r.amount THEN '✅ CORRECT'
        WHEN r.amount = csv.amount / 10 THEN '🚨 DIVISÉ PAR 10'
        WHEN r.amount = csv.amount / 100 THEN '🚨 DIVISÉ PAR 100'
        ELSE '⚠️ AUTRE VALEUR'
    END as statut
FROM recettes r
JOIN (
    VALUES 
    ('RELIQUAT PRET SUR REMISE -COMPTE BANCAIRE ACCD', 3980672.00),
    ('BSIC REVERSEMENT SUR PRECOMPTE : NUMERAIRE', 430000.00),
    ('Loyer Kennedy : Mois de Octobre 2025', 335000.00),
    ('EXPERTISE : Budget de Fonctionnement Juillet 2025', 462000.00),
    ('EXPERTISE : Budget de Fonctionnement Aout 2025', 500000.00),
    ('PBF Kongodjan', 20000.00),
    ('PBF Ahokokro', 100000.00),
    ('BSIC - SOLDE EXPERTISE', 1639219.00),
    ('Numeraire Recupéré sur ACCD', 245000.00),
    ('Salaire Septembre 2025', 270000.00)
) AS csv(description, amount) ON r.description = csv.description
ORDER BY difference DESC;
