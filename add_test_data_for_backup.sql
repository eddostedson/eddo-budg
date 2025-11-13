-- Ajouter des données de test pour la sauvegarde
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier l'état actuel des tables
SELECT 
    'ÉTAT ACTUEL' as test,
    'notes_depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM notes_depenses
UNION ALL
SELECT 
    'ÉTAT ACTUEL' as test,
    'depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM depenses
UNION ALL
SELECT 
    'ÉTAT ACTUEL' as test,
    'recettes' as table_name,
    COUNT(*) as nombre_enregistrements
FROM recettes;

-- 2. Ajouter des données de test si les tables sont vides
INSERT INTO notes_depenses (libelle, montant, description, priorite, type, statut) 
SELECT 
    'Note de test ' || generate_series,
    (random() * 500 + 50)::numeric(10,2),
    'Description de test pour la note ' || generate_series,
    CASE (random() * 3)::int 
        WHEN 0 THEN 'haute'
        WHEN 1 THEN 'moyenne' 
        ELSE 'basse' 
    END,
    'depense',
    'en_attente'
FROM generate_series(1, 3)
WHERE NOT EXISTS (SELECT 1 FROM notes_depenses LIMIT 1);

-- Ajouter des dépenses de test
INSERT INTO depenses (libelle, montant, description, date_depense) 
SELECT 
    'Dépense de test ' || generate_series,
    (random() * 300 + 25)::numeric(10,2),
    'Description de test pour la dépense ' || generate_series,
    CURRENT_DATE - (random() * 30)::int
FROM generate_series(1, 2)
WHERE NOT EXISTS (SELECT 1 FROM depenses LIMIT 1);

-- Ajouter des recettes de test
INSERT INTO recettes (libelle, montant, description, date_recette) 
SELECT 
    'Recette de test ' || generate_series,
    (random() * 1000 + 100)::numeric(10,2),
    'Description de test pour la recette ' || generate_series,
    CURRENT_DATE - (random() * 30)::int
FROM generate_series(1, 2)
WHERE NOT EXISTS (SELECT 1 FROM recettes LIMIT 1);

-- 3. Vérifier l'état après ajout
SELECT 
    'APRÈS AJOUT' as test,
    'notes_depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM notes_depenses
UNION ALL
SELECT 
    'APRÈS AJOUT' as test,
    'depenses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM depenses
UNION ALL
SELECT 
    'APRÈS AJOUT' as test,
    'recettes' as table_name,
    COUNT(*) as nombre_enregistrements
FROM recettes;

-- 4. Afficher un résumé
SELECT 
    'RÉSUMÉ' as test,
    'Données de test ajoutées' as message,
    (SELECT COUNT(*) FROM notes_depenses) as notes_count,
    (SELECT COUNT(*) FROM depenses) as depenses_count,
    (SELECT COUNT(*) FROM recettes) as recettes_count;





























