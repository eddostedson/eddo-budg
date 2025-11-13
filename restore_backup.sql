-- Script de restauration depuis une sauvegarde
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Lister les sauvegardes disponibles
SELECT 
    table_name,
    'Disponible pour restauration' as status
FROM information_schema.tables 
WHERE table_name LIKE '%backup%'
ORDER BY table_name;

-- 2. Fonction pour restaurer depuis une sauvegarde spécifique
-- REMPLACEZ 'nom_de_la_sauvegarde' par le nom réel de votre sauvegarde
-- Exemple: notes_depenses_backup_manual

/*
-- 3. Script de restauration (décommentez et modifiez selon vos besoins)
-- ATTENTION: Ceci va remplacer toutes les données actuelles !

-- Étape 1: Sauvegarder l'état actuel avant restauration
CREATE TABLE notes_depenses_current_backup AS SELECT * FROM notes_depenses;

-- Étape 2: Vider la table actuelle
TRUNCATE TABLE notes_depenses;

-- Étape 3: Restaurer depuis la sauvegarde (remplacez le nom de table)
-- INSERT INTO notes_depenses SELECT * FROM notes_depenses_backup_manual;

-- Étape 4: Vérifier la restauration
-- SELECT COUNT(*) as notes_restaurees FROM notes_depenses;
*/

-- 4. Instructions de sécurité
SELECT 
    'ATTENTION: La restauration remplace toutes les données actuelles!' as warning,
    '1. Faites une sauvegarde avant de restaurer' as etape1,
    '2. Testez d''abord sur une copie' as etape2,
    '3. Vérifiez que la sauvegarde contient les bonnes données' as etape3;





























