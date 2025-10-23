-- Diagnostic AVANCÉ des totaux
-- À exécuter dans Supabase SQL Editor

-- 1. VÉRIFICATION DES TYPES DE DONNÉES
SELECT 
    'TYPES DE DONNÉES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('recettes', 'depenses')
ORDER BY table_name, ordinal_position;

-- 2. VÉRIFICATION DES VALEURS NULL
SELECT 
    'VALEURS NULL RECETTES' as info,
    COUNT(*) as total_lignes,
    COUNT(amount) as amount_non_null,
    COUNT(*) - COUNT(amount) as amount_null
FROM recettes;

SELECT 
    'VALEURS NULL DÉPENSES' as info,
    COUNT(*) as total_lignes,
    COUNT(montant) as montant_non_null,
    COUNT(*) - COUNT(montant) as montant_null
FROM depenses;

-- 3. VÉRIFICATION DES MONTANTS NÉGATIFS OU ZÉRO
SELECT 
    'MONTANTS PROBLÉMATIQUES RECETTES' as info,
    COUNT(*) as nb_montants_problematiques
FROM recettes 
WHERE amount <= 0 OR amount IS NULL;

SELECT 
    'MONTANTS PROBLÉMATIQUES DÉPENSES' as info,
    COUNT(*) as nb_montants_problematiques
FROM depenses 
WHERE montant <= 0 OR montant IS NULL;

-- 4. VÉRIFICATION DES DOUBLONS
SELECT 
    'DOUBLONS RECETTES' as info,
    description,
    amount,
    COUNT(*) as nb_doublons
FROM recettes
GROUP BY description, amount
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- 5. VÉRIFICATION DES LIENS RECETTE-DÉPENSE
SELECT 
    'LIENS RECETTE-DÉPENSE' as info,
    COUNT(DISTINCT r.id) as nb_recettes_avec_depenses,
    COUNT(d.id) as nb_depenses_liees,
    SUM(d.montant) as total_depenses_liees
FROM recettes r
INNER JOIN depenses d ON r.id = d.recette_id;

-- 6. VÉRIFICATION DES DÉPENSES ORPHELINES
SELECT 
    'DÉPENSES ORPHELINES' as info,
    COUNT(*) as nb_depenses_orphelines,
    SUM(montant) as total_depenses_orphelines
FROM depenses d
LEFT JOIN recettes r ON d.recette_id = r.id
WHERE r.id IS NULL;

-- 7. CALCUL FINAL CORRECT
SELECT 
    'CALCUL FINAL' as info,
    (SELECT SUM(amount) FROM recettes) as total_recettes_brut,
    (SELECT SUM(montant) FROM depenses WHERE recette_id IS NOT NULL) as total_depenses_liees,
    (SELECT SUM(montant) FROM depenses WHERE recette_id IS NULL) as total_depenses_orphelines,
    (SELECT SUM(amount) FROM recettes) - (SELECT SUM(montant) FROM depenses WHERE recette_id IS NOT NULL) as solde_correct;
