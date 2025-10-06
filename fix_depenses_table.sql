-- Script de correction pour la table depenses
-- Rendre budget_id optionnel et s'assurer que recette_id fonctionne

-- 1. Vérifier l'état actuel
SELECT 'AVANT CORRECTION' as etat;
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND column_name IN ('budget_id', 'recette_id');

-- 2. Rendre budget_id optionnel (si ce n'est pas déjà fait)
ALTER TABLE depenses 
ALTER COLUMN budget_id DROP NOT NULL;

-- 3. S'assurer que recette_id existe et est optionnel
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'depenses' AND column_name = 'recette_id'
    ) THEN
        ALTER TABLE depenses 
        ADD COLUMN recette_id UUID REFERENCES recettes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Vérifier l'état après correction
SELECT 'APRÈS CORRECTION' as etat;
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'depenses' 
AND column_name IN ('budget_id', 'recette_id');

-- 5. Tester l'insertion d'une dépense avec recette_id seulement
-- (Ceci est un test - ne pas exécuter en production sans vérifier)
/*
INSERT INTO depenses (user_id, libelle, montant, date, recette_id)
VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'Test dépense',
    100.00,
    CURRENT_DATE,
    (SELECT id FROM recettes LIMIT 1)
);
*/

SELECT 'Correction terminée - budget_id est maintenant optionnel' AS status;

