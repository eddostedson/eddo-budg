-- Sauvegarde manuelle - À exécuter régulièrement
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Créer une sauvegarde avec timestamp
CREATE TABLE notes_depenses_backup_manual AS 
SELECT *, NOW() as backup_timestamp FROM notes_depenses;

-- 2. Créer une sauvegarde des dépenses
CREATE TABLE depenses_backup_manual AS 
SELECT *, NOW() as backup_timestamp FROM depenses;

-- 3. Créer une sauvegarde des recettes
CREATE TABLE recettes_backup_manual AS 
SELECT *, NOW() as backup_timestamp FROM recettes;

-- 4. Afficher le résumé des sauvegardes
SELECT 
    'Sauvegarde manuelle créée' as status,
    NOW() as timestamp,
    (SELECT COUNT(*) FROM notes_depenses_backup_manual) as notes_sauvegardees,
    (SELECT COUNT(*) FROM depenses_backup_manual) as depenses_sauvegardees,
    (SELECT COUNT(*) FROM recettes_backup_manual) as recettes_sauvegardees;























