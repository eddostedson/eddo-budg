-- Vérifier la structure de la table notes_depenses
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notes_depenses' 
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT COUNT(*) as nombre_notes_depenses FROM notes_depenses;

-- Voir quelques exemples de données
SELECT * FROM notes_depenses LIMIT 5;
