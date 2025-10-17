-- Migration des données de notes_depenses vers notes
-- Ce script migre les données existantes de notes_depenses vers la table notes

-- 1. Vérifier d'abord la structure de notes_depenses
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notes_depenses' 
ORDER BY ordinal_position;

-- 2. Vérifier les données existantes dans notes_depenses
SELECT COUNT(*) as nombre_notes_depenses FROM notes_depenses;

-- 3. Vérifier les données existantes dans notes
SELECT COUNT(*) as nombre_notes FROM notes;

-- 4. Migration des données (si notes_depenses existe)
DO $$
BEGIN
    -- Vérifier si la table notes_depenses existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes_depenses' AND table_schema = 'public') THEN
        
        -- Insérer les données de notes_depenses dans notes
        INSERT INTO notes (
            user_id,
            libelle,
            montant,
            description,
            date_prevue,
            priorite,
            statut,
            type,
            created_at,
            updated_at
        )
        SELECT 
            user_id,
            libelle,
            montant,
            description,
            date_prevue,
            COALESCE(priorite, 'normale') as priorite,
            COALESCE(statut, 'en_attente') as statut,
            'depense' as type, -- Toutes les notes de notes_depenses sont des dépenses
            COALESCE(created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
        FROM notes_depenses
        WHERE NOT EXISTS (
            -- Éviter les doublons
            SELECT 1 FROM notes n 
            WHERE n.user_id = notes_depenses.user_id 
            AND n.libelle = notes_depenses.libelle 
            AND n.montant = notes_depenses.montant
        );
        
        RAISE NOTICE 'Migration des données de notes_depenses vers notes terminée.';
        
        -- Afficher le nombre de notes migrées
        SELECT COUNT(*) as notes_migrees FROM notes WHERE type = 'depense';
        
    ELSE
        RAISE NOTICE 'Table notes_depenses non trouvée.';
    END IF;
END $$;

-- 5. Vérification finale
SELECT 
    'notes' as table_name,
    COUNT(*) as nombre_enregistrements,
    COUNT(CASE WHEN type = 'depense' THEN 1 END) as notes_depenses,
    COUNT(CASE WHEN type = 'recette' THEN 1 END) as notes_recettes
FROM notes
UNION ALL
SELECT 
    'notes_depenses' as table_name,
    COUNT(*) as nombre_enregistrements,
    COUNT(*) as notes_depenses,
    0 as notes_recettes
FROM notes_depenses
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notes_depenses');

-- 6. Nettoyage optionnel (décommentez si vous voulez supprimer notes_depenses après migration)
-- DROP TABLE IF EXISTS notes_depenses;

SELECT 'Migration terminée avec succès !' AS status;
