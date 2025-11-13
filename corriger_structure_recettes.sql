-- 🔧 CORRIGER LA STRUCTURE DE LA TABLE RECETTES
-- Exécutez cette requête dans Supabase SQL Editor

-- 1️⃣ Ajouter la colonne 'libelle' si elle n'existe pas
ALTER TABLE recettes ADD COLUMN IF NOT EXISTS libelle TEXT;

-- 2️⃣ Si vous avez des données existantes avec 'description', copiez-les vers 'libelle'
UPDATE recettes 
SET libelle = description 
WHERE libelle IS NULL AND description IS NOT NULL;

-- 3️⃣ Rafraîchir le cache du schéma Supabase
NOTIFY pgrst, 'reload schema';

-- 4️⃣ Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'recettes'
ORDER BY ordinal_position;

-- ✅ Vous devriez maintenant voir la colonne 'libelle' dans la liste !

