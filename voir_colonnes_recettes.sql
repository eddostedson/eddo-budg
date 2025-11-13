-- 🔍 VOIR TOUTES LES COLONNES DE LA TABLE RECETTES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recettes'
ORDER BY ordinal_position;

-- 📝 Si la colonne 'libelle' n'existe pas, ajoutez-la :
-- ⚠️ DÉCOMMENTEZ CETTE LIGNE SI NÉCESSAIRE
/*
ALTER TABLE recettes ADD COLUMN IF NOT EXISTS libelle TEXT;
*/

-- 🔄 Après avoir ajouté la colonne, rafraîchissez le cache :
-- ⚠️ DÉCOMMENTEZ CETTE LIGNE APRÈS AVOIR AJOUTÉ LA COLONNE
/*
NOTIFY pgrst, 'reload schema';
*/

